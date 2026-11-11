package com.hotrecharge.app.service;

import com.hotrecharge.app.client.HotV3Client;
import com.hotrecharge.app.dto.Contracts.*;
import com.hotrecharge.app.entity.AppSession;
import com.hotrecharge.app.exception.ApiException;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class CatalogueService {
    private final HotV3Client client; private final AuthService auth;
    public CatalogueService(HotV3Client client,AuthService auth) {this.client=client;this.auth=auth;}
    public List<Product> products(AppSession s) {return client.products(auth.credentials(s));}
    public Product product(AppSession s,String id) {return products(s).stream().filter(p->p.id().equals(id)).findFirst().orElseThrow(ApiException::missing);}
    public List<Balance> balances(AppSession s) {return client.balances(auth.credentials(s));}
    public List<Stock> stock(AppSession s,String id) {product(s,id);return client.stock(auth.credentials(s),id);}
    public Map<String,String> customer(AppSession s,String id,String target) {
        Product p=product(s,id);if(!p.customerLookupSupported())throw ApiException.invalid("Customer lookup is not available for this product.");
        return client.customer(auth.credentials(s),id,target);
    }
}
