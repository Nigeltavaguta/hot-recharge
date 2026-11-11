package com.hotrecharge.app.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotrecharge.app.config.HotConfig;
import com.hotrecharge.app.dto.Contracts.*;
import com.hotrecharge.app.exception.ApiException;
import com.hotrecharge.app.model.PurchaseState;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.*;
import java.net.http.HttpClient;
import java.time.*;
import java.util.*;

/** Documented transport surface. Unknown provider structures fail closed, never guessed. */
@Component @ConditionalOnProperty(name="hot.mode",havingValue="live")
public class LiveHotV3Client implements HotV3Client {
    private final RestClient http; private final ObjectMapper mapper;
    private boolean purchaseEnabled;
    @org.springframework.beans.factory.annotation.Autowired
    public LiveHotV3Client(HotConfig config,ObjectMapper mapper) {
        this.mapper=mapper;
        purchaseEnabled=config.transactionsEnabled;
        var client=HttpClient.newBuilder().connectTimeout(Duration.ofMillis(config.connectTimeout)).followRedirects(HttpClient.Redirect.NEVER).build();
        var factory=new JdkClientHttpRequestFactory(client);factory.setReadTimeout(Duration.ofMillis(config.readTimeout));
        http=RestClient.builder().baseUrl(config.baseUrl).requestFactory(factory).defaultHeader("Accept","application/json").build();
    }
    LiveHotV3Client(RestClient http,ObjectMapper mapper) {this.http=http;this.mapper=mapper;}
    private JsonNode post(String path,Object body,Credentials c) {
        try { var req=http.post().uri(path).contentType(org.springframework.http.MediaType.APPLICATION_JSON);
            if(c!=null) req.header("Authorization","Bearer "+c.token()); return req.body(body).retrieve().body(JsonNode.class);
        } catch(RestClientResponseException e) { throw safe(e.getStatusCode().value()); }
        catch(RestClientException e) { throw new ApiException(503,"PROVIDER_UNAVAILABLE","Provider response unavailable; verify any submitted purchase."); }
    }
    private JsonNode get(String path,Credentials c,Object... args) {
        try { return http.get().uri(path,args).header("Authorization","Bearer "+c.token()).retrieve().body(JsonNode.class); }
        catch(RestClientResponseException e) { throw safe(e.getStatusCode().value()); }
        catch(RestClientException e) { throw new ApiException(503,"PROVIDER_UNAVAILABLE","Provider query unavailable."); }
    }
    private ApiException safe(int status) { return new ApiException(status==401?401:502,status==401?"PROVIDER_AUTH":"PROVIDER_REJECTED",status==401?"Sign in again to reconnect your HOT account.":"Provider request could not be completed."); }
    private String required(JsonNode n,String name) {
        if(n==null || !n.hasNonNull(name) || n.get(name).asText().isBlank()) throw schema(); return n.get(name).asText();
    }
    private ApiException schema() { return new ApiException(502,"UNVERIFIED_PROVIDER_SCHEMA","Provider response mapping requires verification."); }
    public Credentials login(String code,String password) {
        JsonNode n=post("/identity/login",new HotV3Dtos.LoginRequest(code,password),null);
        String token=required(n,"token");
        try {
            // Claims are read only from the token received over authenticated provider TLS, never device input.
            JsonNode claims=mapper.readTree(Base64.getUrlDecoder().decode(token.split("\\.")[1]));
            String account=required(claims,"AccountId");
            return new Credentials(token,required(n,"refreshToken"),new User(account,"","",code,claims.path("email").asText("")));
        } catch(ApiException e) { throw e; } catch(Exception e) { throw schema(); }
    }
    public Credentials refresh(Credentials c) {
        JsonNode n=post("/identity/refresh",new HotV3Dtos.RefreshRequest(c.token(),c.refreshToken()),null);
        return new Credentials(required(n,"token"),required(n,"refreshToken"),c.user());
    }
    public List<Balance> balances(Credentials c) {
        JsonNode n=get("/account/balance/0",c);
        // Envelope not confirmed. Accept only explicit array or balances array, never empty-on-error.
        JsonNode list=n!=null&&n.isArray()?n:n==null?null:n.get("balances");
        if(list==null||!list.isArray()) throw schema();
        List<Balance> out=new ArrayList<>();
        for(JsonNode item:list) {
            String id=required(item,"accountTypeId");String currency=switch(id){case "1","2"->"ZWG";case "3","4"->"USD";default->throw schema();};
            out.add(new Balance(id,required(item,"name"),required(item,"balance"),currency,Instant.now()));
        } return out;
    }
    public List<Product> products(Credentials c) {
        JsonNode root=get("/products/0",c);if(root==null||!root.path("products").isArray())throw schema();
        List<Product> out=new ArrayList<>();
        for(JsonNode p:root.path("products")) {
            JsonNode m=p.path("metaData");String net=m.path("Network").asText("").toLowerCase(Locale.ROOT);
            String category=net.equals("zesa")?"zesa":m.path("RechargeType").asText().equals("Data")?"bundle":m.path("RechargeTypeInformation").asText().equals("Airtime")?"airtime":"payment";
            List<String> options=new ArrayList<>();for(JsonNode o:p.path("requiredOptions")) options.add(required(o,"name"));
            out.add(new Product(required(p,"productId"),category,Set.of("econet","netone","telecel").contains(net)?net:null,required(p,"name"),required(m,"Currency"),required(p,"accountTypeId"),m.path("MinimumRecharge").asText(""),m.path("MaxRecharge").asText(""),m.path("RechargeAmountIncrement").asText(""),options,m.has("AccountQuery")));
        } return out;
    }
    public List<Stock> stock(Credentials c,String id) {
        JsonNode n=get("/query/stock/{id}",c,id);if(n==null||!n.path("stock").isArray())throw schema();
        List<Stock> out=new ArrayList<>();for(JsonNode s:n.path("stock")) {
            String code=required(s,"productCode");out.add(new Stock(id+":"+code,id,code,required(s,"name"),required(s,"description"),required(s,"value"),required(s,"currency"),required(s,"walletTypeId"),"",""));
        }return out;
    }
    public Map<String,String> customer(Credentials c,String id,String target) {
        get("/query/customer/{id}/{target}",c,id,target);
        throw schema(); // Product-specific Details keys have not been verified; do not fabricate names.
    }
    public Result recharge(Credentials c,Recharge r) {
        // Defense in depth: config also rejects live purchase enablement until provider contract review.
        if(!purchaseEnabled)throw new ApiException(503,"LIVE_PURCHASES_DISABLED","Real purchases are disabled pending provider verification.");
        var options=r.options().entrySet().stream().map(e->new HotV3Dtos.RechargeOption(e.getKey(),"string",e.getValue())).toList();
        JsonNode n=post("/products/recharge",new HotV3Dtos.RechargeRequest(r.agentReference(),Integer.parseInt(r.productId()),r.target(),new java.math.BigDecimal(r.amount()),options),c);
        try {return new ProviderResultAdapter().fromRecharge(mapper.treeToValue(n,HotV3Dtos.RechargeResponse.class));}
        catch(Exception e){return new Result(PurchaseState.UNKNOWN,null,null,null,null,"Unrecognized provider result; verify original reference.");}
    }
    public Result lookup(Credentials c,String reference) {
        get("/query/transaction/{reference}",c,reference);
        return new Result(PurchaseState.UNKNOWN,null,null,null,null,"Provider lookup received; rawData final-state mapping is not yet verified.");
    }
    /** Exact documented request shape for later approved dispatch. No automatic retries. */
    public Map<String,Object> rechargePayload(Recharge r) {
        List<Map<String,String>> options=r.options().entrySet().stream().map(e->Map.of("Name",e.getKey(),"ParameterType","string","Value",e.getValue())).toList();
        return Map.of("AgentReference",r.agentReference(),"ProductId",Integer.parseInt(r.productId()),"Target",r.target(),"Amount",new java.math.BigDecimal(r.amount()),"RechargeOptions",options);
    }
}
