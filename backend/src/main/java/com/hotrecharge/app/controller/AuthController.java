package com.hotrecharge.app.controller;

import com.hotrecharge.app.dto.Contracts.*;
import com.hotrecharge.app.entity.AppSession;
import com.hotrecharge.app.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController @RequestMapping("/api/auth")
public class AuthController {
    private final AuthService auth;
    public AuthController(AuthService auth){this.auth=auth;}
    @PostMapping("/login") public Session login(@Valid @RequestBody Login in){return auth.login(in);}
    @PostMapping("/refresh") public Session refresh(@Valid @RequestBody Refresh in){return auth.refresh(in.refreshToken());}
    @PostMapping("/logout") @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void logout(@AuthenticationPrincipal AppSession s){auth.logout(s.id);}
    @PostMapping("/register") public Map<String,String> register(){return Map.of("status","externalOnboardingRequired","url","https://www.hot.co.zw/","message","Register through the official HOT Recharge website. No account has been created by this app.");}
}
