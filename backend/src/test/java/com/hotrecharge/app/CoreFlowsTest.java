package com.hotrecharge.app;

import com.fasterxml.jackson.databind.*;
import com.hotrecharge.app.client.HotV3Client;
import com.hotrecharge.app.dto.Contracts.*;
import com.hotrecharge.app.entity.*;
import com.hotrecharge.app.model.PurchaseState;
import com.hotrecharge.app.repository.*;
import com.hotrecharge.app.security.SecretBox;
import com.hotrecharge.app.service.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test")
class CoreFlowsTest {
    @MockitoSpyBean HotV3Client provider;
    @DynamicPropertySource static void database(DynamicPropertyRegistry registry) {
        String url=System.getenv("TEST_DATABASE_URL");
        if(url!=null) {
            registry.add("spring.datasource.url",()->url);
            registry.add("spring.datasource.username",()->System.getenv().getOrDefault("TEST_DATABASE_USER","hotrecharge"));
            registry.add("spring.datasource.password",()->System.getenv().getOrDefault("TEST_DATABASE_PASSWORD",""));
            registry.add("spring.flyway.enabled",()->true);
            registry.add("spring.jpa.hibernate.ddl-auto",()->"validate");
        }
    }
    @Autowired MockMvc mvc;@Autowired ObjectMapper mapper;@Autowired AuthService auth;@Autowired CatalogueService catalogue;
    @Autowired QuoteService quotes;@Autowired PurchaseService purchases;@Autowired IntentRepository intents;
    @Autowired SessionRepository sessions;@Autowired StubReceiptRepository receipts;@Autowired QuoteRepository quoteRecords;
    private Session login(String mobile) {return auth.login(new Login(mobile,"demo-password"));}
    private AppSession principal(Session s){return auth.authenticate(s.accessToken());}
    private Quote quote(AppSession s,String product,String target,String amount,String code,Map<String,String> options){return quotes.create(s,new QuoteInput(product,target,amount,code,options));}
    private String key(){return UUID.randomUUID().toString();}
    @BeforeEach void clearDisposableTestDatabase() {
        org.mockito.Mockito.clearInvocations(provider);
        intents.deleteAll();quoteRecords.deleteAll();sessions.deleteAll();receipts.deleteAll();
    }

    @Test void endpointsRequireAuthAndRejectInvalidLogin()throws Exception {
        mvc.perform(get("/api/account/balances")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").contentType("application/json").content("{\"mobile\":\"0771234567\",\"password\":\"wrong\"}")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").contentType("application/json").content("{\"mobile\":\"077123456789\",\"password\":\"demo-password\"}")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/auth/register")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("externalOnboardingRequired"));
    }
    @Test void sessionRefreshRotatesAndLogoutRevokes() {
        Session s=login("0771234567");Session next=auth.refresh(s.refreshToken());
        assertThrows(RuntimeException.class,()->auth.authenticate(s.accessToken()));
        assertThrows(RuntimeException.class,()->auth.refresh(s.refreshToken()));
        AppSession stored=principal(next);assertFalse(stored.providerSecret.contains("stub-token"));
        assertNotEquals(next.accessToken(),stored.accessHash);auth.logout(stored.id);
        assertThrows(RuntimeException.class,()->auth.authenticate(next.accessToken()));
    }
    @Test void expiredSessionsCannotAuthenticate() {
        Session s=login("0771234568");AppSession row=principal(s);row.accessExpires=Instant.now().minusSeconds(1);sessions.saveAndFlush(row);
        assertThrows(RuntimeException.class,()->principal(s));
    }
    @Test void catalogueAndAllStockBalancesAreAvailable()throws Exception {
        Session s=login("0771234569");AppSession p=principal(s);
        assertEquals(4,catalogue.balances(p).size());assertEquals(8,catalogue.products(p).size());
        assertEquals("D1",catalogue.stock(p,"demo-data-econet").getFirst().productCode());
        mvc.perform(get("/api/account").header("Authorization","Bearer "+s.accessToken())).andExpect(status().isOk()).andExpect(jsonPath("$.demonstration").value(true));
        mvc.perform(get("/api/networks").header("Authorization","Bearer "+s.accessToken())).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(3));
    }
    @Test void validatesAmountRecipientOptionsAndCorrectUtilityStock() {
        var p=principal(login("0771234570"));
        assertThrows(RuntimeException.class,()->quote(p,"demo-airtime-econet","0771234567","0.001",null,Map.of()));
        assertThrows(RuntimeException.class,()->quote(p,"demo-airtime-econet","invalid","1",null,Map.of()));
        assertThrows(RuntimeException.class,()->quote(p,"demo-zesa","45217893412","5",null,Map.of()));
        Quote q=quote(p,"demo-zesa","45217893412","5",null,Map.of("NotifyNumber","0771234567"));
        assertEquals("4",q.stockAccountId());assertEquals("5.30",q.total());
        assertThrows(RuntimeException.class,()->quote(p,"demo-data-econet","0771234567","9","D1",Map.of()));
    }
    @Test void expiredAndForeignQuotesAreRejected() {
        AppSession p=principal(login("0771234571"));Quote q=quote(p,"demo-airtime-econet","0771234567","1",null,Map.of());
        AppSession other=principal(login("0771234572"));
        assertThrows(RuntimeException.class,()->purchases.purchase(other,"airtime",key(),q.id()));
        QuoteRecord record=quoteRecords.findById(q.id()).orElseThrow();record.expiresAt=Instant.now().minusSeconds(1);quoteRecords.saveAndFlush(record);
        assertThrows(RuntimeException.class,()->purchases.purchase(p,"airtime",key(),q.id()));
    }
    @Test void airtimeDuplicateKeysAndConsumedQuotesCannotDispatchTwice() {
        var p=principal(login("0771234573"));Quote q=quote(p,"demo-airtime-econet","0771234567","1",null,Map.of());String k=key();long count=receipts.count();
        var first=purchases.purchase(p,"airtime",k,q.id());var second=purchases.purchase(p,"airtime",k,q.id());
        assertEquals(first.id(),second.id());assertEquals("success",first.status());assertEquals(count+1,receipts.count());
        org.mockito.Mockito.verify(provider,org.mockito.Mockito.times(1)).recharge(org.mockito.ArgumentMatchers.any(),org.mockito.ArgumentMatchers.any());
        assertThrows(RuntimeException.class,()->purchases.purchase(p,"airtime",key(),q.id()));
        Quote different=quote(p,"demo-airtime-econet","0771234567","2",null,Map.of());
        assertThrows(RuntimeException.class,()->purchases.purchase(p,"airtime",k,different.id()));
    }
    @Test void concurrentDoubleTapsProduceOneProviderRequest()throws Exception {
        var p=principal(login("0771234574"));var q=quote(p,"demo-airtime-econet","0771234567","1",null,Map.of());String k=key();long count=receipts.count();
        try(var executor=Executors.newFixedThreadPool(2)) {
            var a=executor.submit(()->purchases.purchase(p,"airtime",k,q.id()));var b=executor.submit(()->purchases.purchase(p,"airtime",k,q.id()));
            assertEquals(a.get(15,TimeUnit.SECONDS).id(),b.get(15,TimeUnit.SECONDS).id());
        }assertEquals(count+1,receipts.count());
        org.mockito.Mockito.verify(provider,org.mockito.Mockito.times(1)).recharge(org.mockito.ArgumentMatchers.any(),org.mockito.ArgumentMatchers.any());
    }
    @Test void allPurchaseCategoriesPersistAndVaultOnlyContainsConfirmedArtifacts() {
        var p=principal(login("0771234575"));
        var bundle=quote(p,"demo-data-netone","0711234567",null,"D1",Map.of());assertEquals("success",purchases.purchase(p,"bundle",key(),bundle.id()).status());
        var zesa=quote(p,"demo-zesa","45217893412","5",null,Map.of("NotifyNumber","0771234567"));
        var token=purchases.purchase(p,"zesa",key(),zesa.id());assertEquals("00001111222233334444",token.token());
        var payment=quote(p,"demo-payment","123456789","2",null,Map.of());assertEquals("DEMO-PIN-1234",purchases.purchase(p,"payment",key(),payment.id()).pin());
        assertEquals(2,purchases.history(p,null,25,null,null,true).items().size());
        assertTrue(intents.findById(token.id()).orElseThrow().resultSecret.indexOf(token.token())<0);
        var foreign=principal(login("0771234576"));assertThrows(RuntimeException.class,()->purchases.detail(foreign,token.id()));
    }
    @Test void failedPendingAndLostResponseRecoverByOriginalReferenceWithoutResubmit() {
        var p=principal(login("0771234577"));
        var failed=quote(p,"demo-airtime-econet","0772000001","1",null,Map.of());assertEquals("failed",purchases.purchase(p,"airtime",key(),failed.id()).status());
        for(String suffix:List.of("0002","0003","0004")) {
            var q=quote(p,"demo-airtime-econet","077200"+suffix,"1",null,Map.of());String k=key();
            var pending=purchases.purchase(p,"airtime",k,q.id());assertEquals("pending",pending.status());long count=receipts.count();
            assertNull(pending.token());assertEquals(pending.id(),purchases.byKey(p,k).get("transactionId"));
            var recovered=purchases.verify(p,pending.id());assertEquals("success",recovered.status());assertEquals(pending.reference(),recovered.reference());
            purchases.purchase(p,"airtime",k,q.id());assertEquals(count,receipts.count());
        }
    }
    @Test void processRestartWindowIsRecoveredWithoutDispatchingAgain() {
        var p=principal(login("0771234578"));var q=quote(p,"demo-airtime-econet","0772000003","1",null,Map.of());
        var pending=purchases.purchase(p,"airtime",key(),q.id());PurchaseIntent stored=intents.findById(pending.id()).orElseThrow();
        stored.state=PurchaseState.SUBMITTING;stored.resultSecret=null;stored.updatedAt=Instant.now().minusSeconds(120);stored.nextVerificationAt=Instant.now().minusSeconds(120);intents.saveAndFlush(stored);
        long count=receipts.count();purchases.recover();assertEquals("success",purchases.detail(p,pending.id()).status());assertEquals(count,receipts.count());
    }
    @Test void missingLookupDoesNotBecomeFailureOrResubmit() {
        var p=principal(login("0771234579"));var q=quote(p,"demo-airtime-econet","0772000003","1",null,Map.of());var pending=purchases.purchase(p,"airtime",key(),q.id());
        receipts.deleteById(pending.reference());assertEquals("pending",purchases.verify(p,pending.id()).status());
    }
    @Test void historyAndSparseVaultPaginationReturnEveryOwnedRecordExactlyOnce() {
        var p=principal(login("0771234581"));Set<String> expected=new HashSet<>(),artifacts=new HashSet<>();
        for(int index=0;index<7;index++) {
            boolean payment=index%3==0;String category=payment?"payment":"airtime";
            var q=quote(p,payment?"demo-payment":"demo-airtime-econet",payment?"123456789":"0771234567","1",null,Map.of());
            var result=purchases.purchase(p,category,key(),q.id());expected.add(result.id());if(payment)artifacts.add(result.id());
        }
        Set<String> found=new HashSet<>();String cursor=null;
        do {var page=purchases.history(p,cursor,2,null,null,false);for(var row:page.items())assertTrue(found.add(row.id()));cursor=page.nextCursor();}while(cursor!=null);
        assertEquals(expected,found);found.clear();
        do {var page=purchases.history(p,cursor,2,"success",null,true);for(var row:page.items())assertTrue(found.add(row.id()));cursor=page.nextCursor();}while(cursor!=null);
        assertEquals(artifacts,found);
    }
    @Test void httpQuoteAndPurchaseContractReturnsSafeReceipt()throws Exception {
        Session s=login("0771234580");String token="Bearer "+s.accessToken();
        var quoteResponse=mvc.perform(post("/api/quotes").header("Authorization",token).contentType("application/json").content("{\"productId\":\"demo-airtime-econet\",\"target\":\"0771234567\",\"amount\":\"1.00\"}"))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String id=mapper.readTree(quoteResponse).path("id").asText();
        mvc.perform(post("/api/recharge/airtime").header("Authorization",token).header("Idempotency-Key",key()).contentType("application/json").content("{\"quoteId\":\""+id+"\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("success")).andExpect(jsonPath("$.demonstration").value(true)).andExpect(jsonPath("$.token").isEmpty());
    }
}
