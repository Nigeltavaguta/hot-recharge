package com.hotrecharge.app.controller;
import com.hotrecharge.app.config.HotConfig;
import com.hotrecharge.app.dto.Contracts.*;
import com.hotrecharge.app.entity.AppSession;
import com.hotrecharge.app.service.CatalogueService;
import com.hotrecharge.app.util.Json;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.*;
@RestController @RequestMapping("/api")
public class AccountController {
    private final CatalogueService catalogue;private final Json json;private final HotConfig config;
    public AccountController(CatalogueService catalogue,Json json,HotConfig config){this.catalogue=catalogue;this.json=json;this.config=config;}
    @GetMapping("/account") public Map<String,Object> account(@AuthenticationPrincipal AppSession s){return Map.of("user",json.read(s.userJson,User.class),"demonstration",config.mode.equals("stub"),"capabilities",Map.of("registration",false,"recovery",false,"payments",config.mode.equals("stub")));}
    @GetMapping("/account/balances") public List<Balance> balances(@AuthenticationPrincipal AppSession s){return catalogue.balances(s);}
    @GetMapping("/notifications") public Page<Object> notifications(){return new Page<>(List.of(),null);}
}
