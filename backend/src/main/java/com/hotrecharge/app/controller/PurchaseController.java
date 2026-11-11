package com.hotrecharge.app.controller;
import com.hotrecharge.app.dto.Contracts.*;
import com.hotrecharge.app.entity.AppSession;
import com.hotrecharge.app.service.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.util.Map;
@RestController @RequestMapping("/api")
public class PurchaseController {
    private final QuoteService quotes;private final PurchaseService purchases;
    public PurchaseController(QuoteService quotes,PurchaseService purchases){this.quotes=quotes;this.purchases=purchases;}
    @PostMapping("/quotes") public Quote quote(@AuthenticationPrincipal AppSession s,@Valid @RequestBody QuoteInput input){return quotes.create(s,input);}
    private ResponseEntity<Transaction> buy(AppSession s,String kind,String key,Buy input){var t=purchases.purchase(s,kind,key,input.quoteId());return ResponseEntity.status(t.status().equals("pending")?202:200).location(URI.create("/api/transactions/"+t.id())).body(t);}
    @PostMapping("/recharge/airtime") public ResponseEntity<Transaction> airtime(@AuthenticationPrincipal AppSession s,@RequestHeader("Idempotency-Key")String key,@Valid @RequestBody Buy in){return buy(s,"airtime",key,in);}
    @PostMapping("/recharge/data") public ResponseEntity<Transaction> data(@AuthenticationPrincipal AppSession s,@RequestHeader("Idempotency-Key")String key,@Valid @RequestBody Buy in){return buy(s,"bundle",key,in);}
    @PostMapping("/recharge/zesa") public ResponseEntity<Transaction> zesa(@AuthenticationPrincipal AppSession s,@RequestHeader("Idempotency-Key")String key,@Valid @RequestBody Buy in){return buy(s,"zesa",key,in);}
    @PostMapping("/payments") public ResponseEntity<Transaction> payment(@AuthenticationPrincipal AppSession s,@RequestHeader("Idempotency-Key")String key,@Valid @RequestBody Buy in){return buy(s,"payment",key,in);}
    @GetMapping("/transactions") public Page<Transaction> history(@AuthenticationPrincipal AppSession s,@RequestParam(required=false)String cursor,@RequestParam(defaultValue="25")int limit,@RequestParam(required=false)String status,@RequestParam(required=false)String type){return purchases.history(s,cursor,limit,status,type,false);}
    @GetMapping("/transactions/{id}") public Transaction detail(@AuthenticationPrincipal AppSession s,@PathVariable String id){return purchases.detail(s,id);}
    @PostMapping("/transactions/{id}/verify") public Transaction verify(@AuthenticationPrincipal AppSession s,@PathVariable String id){return purchases.verify(s,id);}
    @GetMapping("/purchase-intents/{key}") public Map<String,Object> intent(@AuthenticationPrincipal AppSession s,@PathVariable String key){return purchases.byKey(s,key);}
    @GetMapping("/vault/tokens") public Page<Transaction> vault(@AuthenticationPrincipal AppSession s,@RequestParam(required=false)String cursor,@RequestParam(defaultValue="25")int limit){return purchases.history(s,cursor,limit,"success",null,true);}
}
