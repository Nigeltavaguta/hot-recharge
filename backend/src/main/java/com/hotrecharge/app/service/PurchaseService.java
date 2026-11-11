package com.hotrecharge.app.service;

import com.hotrecharge.app.client.HotV3Client;
import com.hotrecharge.app.config.HotConfig;
import com.hotrecharge.app.dto.Contracts.*;
import com.hotrecharge.app.entity.*;
import com.hotrecharge.app.exception.ApiException;
import com.hotrecharge.app.model.PurchaseState;
import com.hotrecharge.app.repository.*;
import com.hotrecharge.app.security.SecretBox;
import com.hotrecharge.app.util.Json;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import java.time.Instant;
import java.util.*;

@Service
public class PurchaseService {
    private static final org.slf4j.Logger LOG=org.slf4j.LoggerFactory.getLogger(PurchaseService.class);
    private final IntentRepository intents;private final QuoteRepository quotes;private final AuthService auth;
    private final HotV3Client provider;private final TransactionTemplate tx;private final Json json;private final SecretBox box;private final HotConfig config;
    public PurchaseService(IntentRepository intents,QuoteRepository quotes,AuthService auth,HotV3Client provider,TransactionTemplate tx,Json json,SecretBox box,HotConfig config) {
        this.intents=intents;this.quotes=quotes;this.auth=auth;this.provider=provider;this.tx=tx;this.json=json;this.box=box;this.config=config;
    }
    private record Claim(PurchaseIntent intent,boolean dispatch) {}
    public Transaction purchase(AppSession s,String category,String key,String quoteId) {
        if(!key.matches("[A-Za-z0-9_-]{16,100}"))throw ApiException.invalid("A valid idempotency key is required.");
        if(!config.mode.equals("stub"))throw new ApiException(503,"LIVE_PURCHASES_DISABLED","Real financial purchases are disabled.");
        Claim claim;
        try {
            claim=tx.execute(status->{
                QuoteRecord q=quotes.lock(quoteId).orElseThrow(ApiException::missing);
                if(!q.owner.equals(s.owner))throw ApiException.missing();
                var existing=intents.findByOwnerAndIdempotencyKey(s.owner,key);
                if(existing.isPresent())return new Claim(replay(existing.get(),quoteId,category),false);
                var snap=json.read(q.payload,QuoteService.Snapshot.class);
                if(!snap.product().category().equals(category))throw ApiException.invalid("Quote category does not match purchase.");
                if(q.consumed)throw new ApiException(409,"QUOTE_USED","This quote has already been submitted. Check your history.");
                if(!q.expiresAt.isAfter(Instant.now()))throw new ApiException(409,"QUOTE_EXPIRED","Review a new quote before paying.");
                PurchaseIntent i=new PurchaseIntent();i.id=UUID.randomUUID().toString();i.owner=s.owner;i.idempotencyKey=key;i.quoteId=q.id;
                i.reference="HR-"+UUID.randomUUID();i.payload=q.payload;i.sessionId=s.id;i.state=PurchaseState.CREATED;i.createdAt=Instant.now();i.updatedAt=i.createdAt;i.nextVerificationAt=Instant.now().plusSeconds(30);
                q.consumed=true;quotes.save(q);intents.saveAndFlush(i);return new Claim(i,true);
            });
        } catch(DataIntegrityViolationException e) {
            PurchaseIntent existing=intents.findByOwnerAndIdempotencyKey(s.owner,key).orElseThrow(()->new ApiException(409,"CONCURRENT_PURCHASE","Recover using the original purchase key."));
            return view(replay(existing,quoteId,category));
        }
        if(claim==null)throw new IllegalStateException("Purchase claim unavailable");
        if(!claim.dispatch())return view(claim.intent());
        PurchaseIntent i=claim.intent();
        boolean dispatch=Boolean.TRUE.equals(tx.execute(status->{
            PurchaseIntent locked=intents.lock(i.id).orElseThrow();
            if(locked.state!=PurchaseState.CREATED)return false;
            locked.state=PurchaseState.SUBMITTING;locked.updatedAt=Instant.now();intents.saveAndFlush(locked);return true;
        }));
        if(!dispatch)return detail(s,i.id);
        var snap=json.read(i.payload,QuoteService.Snapshot.class);
        try {
            var result=provider.recharge(auth.credentials(s),new HotV3Client.Recharge(i.reference,snap.product().id(),snap.target(),snap.amount(),snap.options()));
            apply(i.id,result);
        } catch(Exception e) {
            // No exception after dispatch proves non-execution. Preserve original reference and never retry submission.
            apply(i.id,new HotV3Client.Result(PurchaseState.UNKNOWN,null,null,null,null,"Outcome uncertain. Check status; do not purchase again."));
        }
        return detail(s,i.id);
    }
    private PurchaseIntent replay(PurchaseIntent i,String quoteId,String category) {
        if(!i.quoteId.equals(quoteId)||!json.read(i.payload,QuoteService.Snapshot.class).product().category().equals(category))
            throw new ApiException(409,"IDEMPOTENCY_CONFLICT","This key belongs to another purchase.");return i;
    }
    private void apply(String id,HotV3Client.Result r) {
        tx.executeWithoutResult(status->{
            PurchaseIntent i=intents.lock(id).orElseThrow();
            if(i.state.terminal())return;
            i.state=r.state();i.resultSecret=box.seal(json.write(r));i.updatedAt=Instant.now();i.nextVerificationAt=Instant.now().plusSeconds(Math.min(1800,30L*(1L<<Math.min(i.recoveryAttempts,6))));intents.saveAndFlush(i);
            LOG.atInfo().addKeyValue("intentId",i.id).addKeyValue("state",i.state.name()).log("Purchase state updated");
        });
    }
    private PurchaseIntent owned(AppSession s,String id) {
        PurchaseIntent i=intents.findById(id).orElseThrow(ApiException::missing);if(!i.owner.equals(s.owner))throw ApiException.missing();return i;
    }
    public Transaction detail(AppSession s,String id) {return view(owned(s,id));}
    public Map<String,Object> byKey(AppSession s,String key) {
        PurchaseIntent i=intents.findByOwnerAndIdempotencyKey(s.owner,key).orElseThrow(ApiException::missing);
        return Map.of("key",key,"transactionId",i.id,"state",i.state,"transaction",view(i));
    }
    public Transaction verify(AppSession s,String id) {
        PurchaseIntent i=owned(s,id);if(!i.state.terminal())verifyRecord(i,s);return detail(s,id);
    }
    private void verifyRecord(PurchaseIntent i,AppSession session) {
        try {apply(i.id,provider.lookup(auth.credentials(session),i.reference));}
        catch(Exception e) { /* Remain unresolved. Scheduled backoff controls later lookup. */ }
    }
    @Scheduled(fixedDelayString="${hot.recovery-delay-ms:30000}")
    public void recover() {
        var records=intents.findByStateInAndNextVerificationAtBefore(List.of(PurchaseState.CREATED,PurchaseState.SUBMITTING,PurchaseState.PENDING,PurchaseState.UNKNOWN),Instant.now(),PageRequest.of(0,25));
        for(PurchaseIntent i:records) {
            // Take a DB lease before lookup. Recovery never dispatches a purchase.
            boolean lease=Boolean.TRUE.equals(tx.execute(status->{
                var current=intents.lock(i.id).orElseThrow();if(current.state.terminal()||(current.nextVerificationAt!=null&&current.nextVerificationAt.isAfter(Instant.now())))return false;
                current.updatedAt=Instant.now();if(current.state==PurchaseState.CREATED||current.state==PurchaseState.SUBMITTING)current.state=PurchaseState.UNKNOWN;
                current.recoveryAttempts++;current.nextVerificationAt=Instant.now().plusSeconds(Math.min(1800,30L*(1L<<Math.min(current.recoveryAttempts,6)))+java.util.concurrent.ThreadLocalRandom.current().nextInt(6));
                intents.saveAndFlush(current);return true;
            }));
            if(lease)try {verifyRecord(i,auth.recoverSession(i.sessionId,i.owner));}catch(Exception e){/* Needs user reconnection. Never resubmit. */}
        }
    }
    public Page<Transaction> history(AppSession s,String cursor,int limit,String status,String type,boolean vault) {
        if(limit<1||limit>100)throw ApiException.invalid("limit must be 1 to 100");
        int page=0;try {if(cursor!=null)page=Integer.parseInt(new String(Base64.getUrlDecoder().decode(cursor),java.nio.charset.StandardCharsets.UTF_8));}catch(Exception e){throw ApiException.invalid("Invalid cursor.");}
        if(page<0||page>100000)throw ApiException.invalid("Invalid cursor.");
        var rows=intents.findByOwnerOrderByCreatedAtDescIdDesc(s.owner,PageRequest.of(page,limit));
        List<Transaction> items=rows.stream().map(this::view).filter(t->status==null||status.equals(t.status())).filter(t->type==null||type.equals(t.type()))
            .filter(t->!vault||(t.status().equals("success")&&(t.token()!=null||t.pin()!=null))).toList();
        String next=rows.size()<limit?null:Base64.getUrlEncoder().withoutPadding().encodeToString(Integer.toString(page+1).getBytes(java.nio.charset.StandardCharsets.UTF_8));
        return new Page<>(items,next);
    }
    private Transaction view(PurchaseIntent i) {
        var snap=json.read(i.payload,QuoteService.Snapshot.class);var p=snap.product();
        HotV3Client.Result r=i.resultSecret==null?null:json.read(box.open(i.resultSecret),HotV3Client.Result.class);
        boolean success=i.state==PurchaseState.CONFIRMED_SUCCESS;
        String state=success?"success":i.state==PurchaseState.CONFIRMED_FAILURE?"failed":"pending";
        return new Transaction(i.id,i.reference,p.category(),p.name(),snap.target(),snap.amount(),snap.fee(),p.currency(),i.createdAt,state,p.network(),
            success&&r!=null?r.token():null,success&&r!=null?r.units():null,success&&r!=null?r.pin():null,
            r==null?"Purchase is being verified. Do not repeat it.":r.message(),p.stockAccountId(),i.state.terminal()?"confirmed":i.state==PurchaseState.UNKNOWN?"unknown":"pending",config.mode.equals("stub"));
    }
}
