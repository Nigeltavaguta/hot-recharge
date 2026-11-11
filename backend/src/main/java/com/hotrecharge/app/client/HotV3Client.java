package com.hotrecharge.app.client;

import com.hotrecharge.app.dto.Contracts.*;
import com.hotrecharge.app.model.PurchaseState;
import java.util.*;

public interface HotV3Client {
    record Credentials(String token,String refreshToken,User user) {}
    record Recharge(String agentReference,String productId,String target,String amount,Map<String,String> options) {}
    record Result(PurchaseState state,String providerId,String token,String pin,String units,String message) {}
    Credentials login(String accessCode,String password);
    Credentials refresh(Credentials credentials);
    List<Balance> balances(Credentials credentials);
    List<Product> products(Credentials credentials);
    List<Stock> stock(Credentials credentials,String productId);
    Map<String,String> customer(Credentials credentials,String productId,String target);
    Result recharge(Credentials credentials,Recharge request);
    Result lookup(Credentials credentials,String reference);
}
