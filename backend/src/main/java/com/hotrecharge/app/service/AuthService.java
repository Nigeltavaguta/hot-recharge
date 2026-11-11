package com.hotrecharge.app.service;

import com.hotrecharge.app.client.HotV3Client;
import com.hotrecharge.app.config.HotConfig;
import com.hotrecharge.app.dto.Contracts.*;
import com.hotrecharge.app.entity.AppSession;
import com.hotrecharge.app.exception.ApiException;
import com.hotrecharge.app.repository.SessionRepository;
import com.hotrecharge.app.security.SecretBox;
import com.hotrecharge.app.util.Json;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.util.UUID;

@Service
public class AuthService {
    private final SessionRepository sessions; private final HotV3Client provider; private final SecretBox box;private final Json json;private final HotConfig config;
    public AuthService(SessionRepository sessions,HotV3Client provider,SecretBox box,Json json,HotConfig config) { this.sessions=sessions;this.provider=provider;this.box=box;this.json=json;this.config=config; }
    @Transactional public Session login(Login input) {
        var credentials=provider.login(input.mobile(),input.password());
        AppSession s=new AppSession();s.id=UUID.randomUUID().toString();s.owner=credentials.user().accountId();
        s.userJson=json.write(credentials.user());s.providerSecret=box.seal(json.write(credentials));
        return issue(s);
    }
    private Session issue(AppSession s) {
        String access=box.token(),refresh=box.token();s.accessHash=SecretBox.hash(access);s.refreshHash=SecretBox.hash(refresh);
        s.accessExpires=Instant.now().plusSeconds(900);s.refreshExpires=Instant.now().plusSeconds(604800);sessions.saveAndFlush(s);
        return new Session(json.read(s.userJson,User.class),access,refresh,s.accessExpires,config.mode.equals("stub"));
    }
    public AppSession authenticate(String token) {
        AppSession s=sessions.findByAccessHash(SecretBox.hash(token)).orElseThrow(AuthService::unauthorized);
        if(s.revoked||!s.accessExpires.isAfter(Instant.now())||!s.refreshExpires.isAfter(Instant.now())) throw unauthorized();return s;
    }
    @Transactional public Session refresh(String token) {
        AppSession s=sessions.lockRefresh(SecretBox.hash(token)).orElseThrow(AuthService::unauthorized);
        if(s.revoked||!s.refreshExpires.isAfter(Instant.now())) throw unauthorized();
        var credentials=provider.refresh(json.read(box.open(s.providerSecret),HotV3Client.Credentials.class));s.providerSecret=box.seal(json.write(credentials));return issue(s);
    }
    @Transactional public void logout(String id) { sessions.lock(id).ifPresent(s->{s.revoked=true;s.providerSecret=box.seal("{}");}); }
    @Transactional public HotV3Client.Credentials credentials(AppSession s) {
        AppSession current=sessions.lock(s.id).orElseThrow(AuthService::unauthorized);
        if(current.revoked||!current.refreshExpires.isAfter(Instant.now()))throw unauthorized();
        var credentials=json.read(box.open(current.providerSecret),HotV3Client.Credentials.class);
        if(config.mode.equals("live")) {
            try {
                String claims=new String(java.util.Base64.getUrlDecoder().decode(credentials.token().split("\\.")[1]),java.nio.charset.StandardCharsets.UTF_8);
                var data=json.read(claims,java.util.Map.class);Object exp=data.get("exp");
                if(!(exp instanceof Number))throw unauthorized();
                if(((Number)exp).longValue()<=Instant.now().plusSeconds(30).getEpochSecond()) {
                    credentials=provider.refresh(credentials);current.providerSecret=box.seal(json.write(credentials));sessions.saveAndFlush(current);
                }
            } catch(ApiException e){throw e;}catch(Exception e){throw unauthorized();}
        }
        return credentials;
    }
    public AppSession recoverSession(String id,String owner) {
        AppSession s=sessions.findById(id).orElseThrow(AuthService::unauthorized);
        if(!s.owner.equals(owner))throw unauthorized();
        if(s.revoked||!s.refreshExpires.isAfter(Instant.now()))return sessions.findFirstByOwnerAndRevokedFalseAndRefreshExpiresAfterOrderByRefreshExpiresDesc(owner,Instant.now()).orElseThrow(AuthService::unauthorized);
        return s;
    }
    public static ApiException unauthorized() { return new ApiException(401,"UNAUTHENTICATED","Sign in to continue."); }
}
