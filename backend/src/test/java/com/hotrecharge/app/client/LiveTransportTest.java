package com.hotrecharge.app.client;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotrecharge.app.dto.Contracts.User;
import com.hotrecharge.app.model.PurchaseState;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

/** Synthetic documented-shape transport fixtures, not provider-approved live payloads. */
class LiveTransportTest {
    private final RestClient.Builder builder=RestClient.builder().baseUrl("https://ssl.hot.co.zw/api/v3");
    private final MockRestServiceServer server=MockRestServiceServer.bindTo(builder).build();
    private final LiveHotV3Client client=new LiveHotV3Client(builder.build(),new ObjectMapper());
    private final HotV3Client.Credentials credentials=new HotV3Client.Credentials("provider-secret","refresh-secret",new User("account","","","0771234567",""));
    @Test void loginUsesDocumentedCredentialsAndKeepsProviderTokensBehindAdapter() {
        String token="header."+Base64.getUrlEncoder().withoutPadding().encodeToString("{\"AccountId\":\"123\",\"email\":\"demo@example.invalid\"}".getBytes(StandardCharsets.UTF_8))+".signature";
        server.expect(requestTo("https://ssl.hot.co.zw/api/v3/identity/login")).andExpect(method(HttpMethod.POST))
            .andExpect(content().json("{\"AccessCode\":\"0771234567\",\"Password\":\"fixture-password\"}"))
            .andRespond(withSuccess("{\"token\":\""+token+"\",\"refreshToken\":\"new-refresh\"}",MediaType.APPLICATION_JSON));
        var result=client.login("0771234567","fixture-password");assertEquals("123",result.user().accountId());assertEquals("",result.user().firstName());server.verify();
    }
    @Test void refreshPostsTokenPairAndReplacesCredentials() {
        server.expect(requestTo("https://ssl.hot.co.zw/api/v3/identity/refresh")).andExpect(method(HttpMethod.POST))
            .andExpect(content().json("{\"token\":\"provider-secret\",\"refreshToken\":\"refresh-secret\"}"))
            .andRespond(withSuccess("{\"token\":\"next\",\"refreshToken\":\"next-refresh\"}",MediaType.APPLICATION_JSON));
        assertEquals("next",client.refresh(credentials).token());server.verify();
    }
    @Test void catalogueStockBalancesAndLookupUseBearerHeaderAndDocumentedRoutes() {
        server.expect(requestTo("https://ssl.hot.co.zw/api/v3/products/0")).andExpect(header("Authorization","Bearer provider-secret"))
            .andRespond(withSuccess("{\"products\":[]}",MediaType.APPLICATION_JSON));
        server.expect(requestTo("https://ssl.hot.co.zw/api/v3/query/stock/16"))
            .andRespond(withSuccess("{\"stock\":[{\"productId\":16,\"productCode\":\"D1\",\"name\":\"Fixture\",\"description\":\"Fixture only\",\"value\":1.00,\"currency\":\"USD\",\"walletTypeId\":3}]}",MediaType.APPLICATION_JSON));
        server.expect(requestTo("https://ssl.hot.co.zw/api/v3/account/balance/0"))
            .andRespond(withSuccess("[{\"accountTypeId\":4,\"name\":\"Utilities\",\"balance\":40}]",MediaType.APPLICATION_JSON));
        server.expect(requestTo("https://ssl.hot.co.zw/api/v3/query/transaction/original-ref"))
            .andRespond(withSuccess("{\"rawData\":\"unverified\"}",MediaType.APPLICATION_JSON));
        assertTrue(client.products(credentials).isEmpty());assertEquals("D1",client.stock(credentials,"16").getFirst().productCode());
        assertEquals("4",client.balances(credentials).getFirst().id());assertEquals(PurchaseState.UNKNOWN,client.lookup(credentials,"original-ref").state());server.verify();
    }
    @Test void invalidBusinessSchemaAndProviderErrorsCannotBecomeSuccess() {
        server.expect(requestTo("https://ssl.hot.co.zw/api/v3/account/balance/0"))
            .andRespond(withSuccess("{\"successful\":false}",MediaType.APPLICATION_JSON));
        server.expect(requestTo("https://ssl.hot.co.zw/api/v3/products/0")).andRespond(withUnauthorizedRequest().body("sensitive provider message"));
        assertThrows(RuntimeException.class,()->client.balances(credentials));
        var error=assertThrows(RuntimeException.class,()->client.products(credentials));assertFalse(error.getMessage().contains("sensitive"));server.verify();
    }
}
