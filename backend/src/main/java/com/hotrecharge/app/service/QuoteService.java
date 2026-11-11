package com.hotrecharge.app.service;

import com.hotrecharge.app.config.HotConfig;
import com.hotrecharge.app.dto.Contracts;
import com.hotrecharge.app.dto.Contracts.*;
import com.hotrecharge.app.entity.*;
import com.hotrecharge.app.exception.ApiException;
import com.hotrecharge.app.repository.QuoteRepository;
import com.hotrecharge.app.util.Json;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Service
public class QuoteService {
    public record Snapshot(Product product,String target,String amount,String fee,String total,Map<String,String> options,Quote quote) {}
    private final CatalogueService catalogue;private final QuoteRepository quotes;private final HotConfig config;private final Json json;
    public QuoteService(CatalogueService catalogue,QuoteRepository quotes,HotConfig config,Json json) {this.catalogue=catalogue;this.quotes=quotes;this.config=config;this.json=json;}
    public Quote create(AppSession s,QuoteInput in) {
        if(config.mode.equals("live"))throw new ApiException(503,"LIVE_QUOTES_DISABLED","Live fee and product mappings require verification before quoting.");
        Product p=catalogue.product(s,in.productId());String target=in.target();Map<String,String> options=new HashMap<>(in.options()==null?Map.of():in.options());
        if(p.category().equals("airtime")||p.category().equals("bundle")) {
            if(!target.matches("07[1378][0-9]{7}"))throw ApiException.invalid("Enter a valid mobile number.");
        } else if(p.category().equals("zesa")) {
            if(!target.matches("[0-9]{11}"))throw ApiException.invalid("Enter an 11-digit meter number.");catalogue.customer(s,p.id(),target);
        } else if(!target.matches("[A-Za-z0-9 -]{3,40}"))throw ApiException.invalid("Enter a valid payment account.");
        BigDecimal amount;
        if(p.requiredOptions().contains("ProductCode")) {
            Stock stock=catalogue.stock(s,p.id()).stream().filter(x->x.productCode().equals(in.productCode())).findFirst().orElseThrow(()->ApiException.invalid("Choose an available bundle."));
            if(!stock.stockAccountId().equals(p.stockAccountId())||!stock.currency().equals(p.currency()))throw ApiException.invalid("Product stock configuration changed.");
            amount=Contracts.money(stock.price());options.put("ProductCode",stock.productCode());
            if(in.amount()!=null&&Contracts.money(in.amount()).compareTo(amount)!=0)throw ApiException.invalid("Bundle price has changed.");
        } else amount=Contracts.money(in.amount());
        if(amount.compareTo(Contracts.money(p.minAmount()))<0||amount.compareTo(Contracts.money(p.maxAmount()))>0||amount.remainder(Contracts.money(p.increment())).signum()!=0)throw ApiException.invalid("Amount is outside product limits.");
        for(String option:p.requiredOptions())if(!options.containsKey(option)||options.get(option).isBlank())throw ApiException.invalid("Missing required option: "+option);
        if(options.containsKey("NotifyNumber")&&!options.get("NotifyNumber").matches("07[1378][0-9]{7}"))throw ApiException.invalid("Enter a valid notification mobile number.");
        if(!p.requiredOptions().containsAll(options.keySet()))throw ApiException.invalid("Unsupported product option.");
        Balance balance=catalogue.balances(s).stream().filter(b->b.id().equals(p.stockAccountId())&&b.currency().equals(p.currency())).findFirst().orElseThrow(()->ApiException.invalid("Required stock account is unavailable."));
        BigDecimal fee=p.category().equals("zesa")?new BigDecimal("0.30"):BigDecimal.ZERO.setScale(2);BigDecimal total=amount.add(fee);
        if(Contracts.money(balance.balance()).compareTo(total)<0)throw ApiException.invalid("Insufficient stock balance.");
        String id=UUID.randomUUID().toString();Instant expiry=Instant.now().plusSeconds(120);
        Quote dto=new Quote(id,expiry,p.category(),p.name(),List.of(Map.of("label","For","value",target)),amount.toPlainString(),fee.toPlainString(),total.toPlainString(),p.currency(),p.stockAccountId(),balance.name(),balance.balance(),target,true);
        QuoteRecord record=new QuoteRecord();record.id=id;record.owner=s.owner;record.expiresAt=expiry;record.payload=json.write(new Snapshot(p,target,amount.toPlainString(),fee.toPlainString(),total.toPlainString(),Map.copyOf(options),dto));quotes.saveAndFlush(record);return dto;
    }
}
