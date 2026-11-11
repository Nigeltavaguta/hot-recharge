package com.hotrecharge.app.client;

import com.hotrecharge.app.dto.Contracts.*;
import com.hotrecharge.app.entity.StubReceipt;
import com.hotrecharge.app.exception.ApiException;
import com.hotrecharge.app.model.PurchaseState;
import com.hotrecharge.app.repository.StubReceiptRepository;
import com.hotrecharge.app.security.SecretBox;
import com.hotrecharge.app.util.Json;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import java.time.Instant;
import java.util.*;

@Component @ConditionalOnProperty(name="hot.mode",havingValue="stub",matchIfMissing=true)
public class StubHotV3Client implements HotV3Client {
    private final StubReceiptRepository receipts; private final SecretBox box; private final Json json;
    public StubHotV3Client(StubReceiptRepository receipts,SecretBox box,Json json) { this.receipts=receipts;this.box=box;this.json=json; }
    public Credentials login(String code,String password) {
        if (!password.equals("demo-password")) throw new ApiException(401,"BAD_CREDENTIALS","Use demo-password in demonstration mode.");
        return new Credentials("stub-token","stub-refresh",new User("demo-"+code,"Demo","Account",code,""));
    }
    public Credentials refresh(Credentials c) { return new Credentials("stub-token-refreshed","stub-refresh-refreshed",c.user()); }
    public List<Balance> balances(Credentials c) { return List.of(
        new Balance("3","DEMO USD","128.45","USD",Instant.now()),new Balance("1","DEMO ZWG","950.00","ZWG",Instant.now()),
        new Balance("2","DEMO ZWG Utilities","500.00","ZWG",Instant.now()),new Balance("4","DEMO USD Utilities","40.00","USD",Instant.now())); }
    public List<Product> products(Credentials c) {
        List<Product> out=new ArrayList<>();
        for(String n:List.of("econet","netone","telecel")) {
            out.add(new Product("demo-airtime-"+n,"airtime",n,"DEMO "+n+" airtime","USD","3","0.10","100.00","0.01",List.of(),false));
            out.add(new Product("demo-data-"+n,"bundle",n,"DEMO "+n+" data","USD","3","1.00","100.00","0.01",List.of("ProductCode"),false));
        }
        out.add(new Product("demo-zesa","zesa",null,"DEMO ZESA","USD","4","5.00","100.00","0.01",List.of("NotifyNumber"),true));
        out.add(new Product("demo-payment","payment",null,"DEMO subscription PIN","USD","3","1.00","100.00","0.01",List.of(),false));
        return out;
    }
    public List<Stock> stock(Credentials c,String id) {
        if(products(c).stream().noneMatch(p->p.id().equals(id))) throw ApiException.missing();
        return List.of(new Stock(id+":D1",id,"D1","DEMO daily data","Simulated 1GB daily bundle","1.00","USD","3","1 GB","1 day"),
            new Stock(id+":W5",id,"W5","DEMO weekly data","Simulated 5GB weekly bundle","5.00","USD","3","5 GB","7 days"));
    }
    public Map<String,String> customer(Credentials c,String id,String target) {
        if(!id.equals("demo-zesa") || !target.matches("[0-9]{11}") || target.endsWith("0000")) throw ApiException.invalid("Demonstration meter not found.");
        return Map.of("name","DEMO CUSTOMER","address","Demonstration address, not a verified HOT customer");
    }
    public Result recharge(Credentials c,Recharge request) {
        // Only stub mode recognizes scenario digits. No actual credentials or network calls.
        String end=request.target();
        PurchaseState state=end.endsWith("0001")?PurchaseState.CONFIRMED_FAILURE:
            end.endsWith("0002")||end.endsWith("0003")||end.endsWith("0004")?PurchaseState.PENDING:PurchaseState.CONFIRMED_SUCCESS;
        Result result=new Result(state,"DEMO-"+request.agentReference(),request.productId().equals("demo-zesa")?"00001111222233334444":null,
            request.productId().equals("demo-payment")?"DEMO-PIN-1234":null,request.productId().equals("demo-zesa")?"DEMO 10 kWh":null,"Demonstration provider result");
        StubReceipt record=new StubReceipt();record.reference=request.agentReference();record.resultSecret=box.seal(json.write(result));
        receipts.saveAndFlush(record);
        if(end.endsWith("0003")||end.endsWith("0004")) throw new ApiException(504,"STUB_TIMEOUT","Simulated response lost after submission.");
        return result;
    }
    public Result lookup(Credentials c,String reference) {
        StubReceipt receipt=receipts.findById(reference).orElseThrow(()->new ApiException(503,"UNRESOLVED","Demonstration result is not yet known."));
        Result r=json.read(box.open(receipt.resultSecret),Result.class);
        return r.state()==PurchaseState.PENDING?new Result(PurchaseState.CONFIRMED_SUCCESS,r.providerId(),r.token(),r.pin(),r.units(),"Demonstration purchase confirmed by lookup"):r;
    }
}
