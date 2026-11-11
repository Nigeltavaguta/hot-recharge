package com.hotrecharge.app;

import com.hotrecharge.app.config.HotConfig;
import com.hotrecharge.app.security.SecretBox;
import com.hotrecharge.app.client.LiveHotV3Client;
import com.hotrecharge.app.client.HotV3Client;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import java.util.*;
import static org.junit.jupiter.api.Assertions.*;

class SafetyUnitTest {
    private HotConfig config(){var c=new HotConfig();c.encryptionKey="AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";c.mode="live";c.baseUrl="https://ssl.hot.co.zw/api/v3";c.connectTimeout=1000;c.readTimeout=2000;return c;}
    @Test void encryptedSecretsAreAuthenticatedAndRandomized(){var box=new SecretBox(config());String a=box.seal("secret"),b=box.seal("secret");assertNotEquals(a,b);assertEquals("secret",box.open(a));assertThrows(RuntimeException.class,()->box.open(a.substring(4)));}
    @Test void documentedRechargePayloadAndKillSwitchAreExplicit(){var client=new LiveHotV3Client(config(),new ObjectMapper());var in=new HotV3Client.Recharge("original","16","0771234567","1.00",Map.of("ProductCode","D1"));var body=client.rechargePayload(in);assertEquals("original",body.get("AgentReference"));assertEquals(16,body.get("ProductId"));assertEquals(List.of(Map.of("Name","ProductCode","ParameterType","string","Value","D1")),body.get("RechargeOptions"));assertThrows(RuntimeException.class,()->client.recharge(null,in));}
}
