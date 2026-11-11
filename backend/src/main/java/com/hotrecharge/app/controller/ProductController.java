package com.hotrecharge.app.controller;
import com.hotrecharge.app.dto.Contracts.*;
import com.hotrecharge.app.entity.AppSession;
import com.hotrecharge.app.service.CatalogueService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.time.Instant;
import java.util.*;
@RestController @RequestMapping("/api")
public class ProductController {
    private final CatalogueService catalogue;
    public ProductController(CatalogueService catalogue){this.catalogue=catalogue;}
    @GetMapping("/products") public List<Product> products(@AuthenticationPrincipal AppSession s,@RequestParam(required=false)String category,@RequestParam(required=false)String network,@RequestParam(required=false)String currency){return catalogue.products(s).stream().filter(p->category==null||p.category().equals(category)).filter(p->network==null||network.equals(p.network())).filter(p->currency==null||currency.equals(p.currency())).toList();}
    @GetMapping("/products/{id}") public Product product(@AuthenticationPrincipal AppSession s,@PathVariable String id){return catalogue.product(s,id);}
    @GetMapping("/products/{id}/stock") public List<Stock> stock(@AuthenticationPrincipal AppSession s,@PathVariable String id){return catalogue.stock(s,id);}
    @GetMapping("/networks") public List<Map<String,Object>> networks(@AuthenticationPrincipal AppSession s){return catalogue.products(s).stream().map(Product::network).filter(Objects::nonNull).distinct().map(n->Map.<String,Object>of("id",n,"name",n,"available",true)).toList();}
    @GetMapping("/payments/services") public List<Map<String,Object>> payments(@AuthenticationPrincipal AppSession s){return catalogue.products(s).stream().filter(p->p.category().equals("payment")).map(p->Map.<String,Object>of("id",p.id(),"name",p.name(),"productIds",List.of(p.id()))).toList();}
    @PostMapping("/zesa/validate") public Map<String,Object> meter(@AuthenticationPrincipal AppSession s,@Valid @RequestBody MeterInput input){return Map.of("meter",input.meter(),"customer",catalogue.customer(s,input.productId(),input.meter()),"verified",true,"checkedAt",Instant.now());}
}
