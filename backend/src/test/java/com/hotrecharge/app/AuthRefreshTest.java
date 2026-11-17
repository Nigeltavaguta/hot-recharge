package com.hotrecharge.app;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hotrecharge.app.client.HotV3Client;
import com.hotrecharge.app.config.HotConfig;
import com.hotrecharge.app.dto.Contracts.User;
import com.hotrecharge.app.entity.AppSession;
import com.hotrecharge.app.repository.SessionRepository;
import com.hotrecharge.app.security.SecretBox;
import com.hotrecharge.app.service.AuthService;
import com.hotrecharge.app.util.Json;
import java.time.Instant;
import java.util.*;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuthRefreshTest {
    @Test void appRestoreDoesNotRefreshUnexpiredHotToken() { exercise(false); }
    @Test void expiredHotTokenIsRefreshedAndEncryptedBeforeAppTokensRotate() { exercise(true); }
    private void exercise(boolean expired) {
        var config=new HotConfig();config.mode="live";config.encryptionKey="AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
        var box=new SecretBox(config);var json=new Json(new ObjectMapper());
        var repository=mock(SessionRepository.class);var provider=mock(HotV3Client.class);
        var user=new User("123","","","","member@example.invalid");
        String claims="{\"exp\":"+Instant.now().plusSeconds(expired?-60:3600).getEpochSecond()+"}";
        String token="header."+Base64.getUrlEncoder().withoutPadding().encodeToString(claims.getBytes(java.nio.charset.StandardCharsets.UTF_8))+".signature";
        var original=new HotV3Client.Credentials(token,"provider-refresh",user);
        var row=new AppSession();row.id="session";row.owner="123";row.refreshExpires=Instant.now().plusSeconds(600);
        row.providerSecret=box.seal(json.write(original));row.userJson=json.write(user);
        when(repository.lockRefresh(SecretBox.hash("app-refresh"))).thenReturn(Optional.of(row));
        when(repository.lock("session")).thenReturn(Optional.of(row));
        if(expired)when(provider.refresh(original)).thenReturn(new HotV3Client.Credentials("replacement","new-refresh",user));
        var result=new AuthService(repository,provider,box,json,config).refresh("app-refresh");
        assertEquals("123",result.user().accountId());assertNotEquals("app-refresh",result.refreshToken());
        if(expired) {
            verify(provider,times(1)).refresh(original);
            assertEquals("replacement",json.read(box.open(row.providerSecret),HotV3Client.Credentials.class).token());
        } else verifyNoInteractions(provider);
        verify(repository,atLeastOnce()).saveAndFlush(row);
    }
}
