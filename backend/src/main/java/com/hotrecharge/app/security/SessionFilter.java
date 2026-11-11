package com.hotrecharge.app.security;

import com.hotrecharge.app.service.AuthService;
import com.hotrecharge.app.exception.ApiException;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.List;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

@Component
public class SessionFilter extends OncePerRequestFilter {
    private final AuthService auth;
    public SessionFilter(AuthService auth) { this.auth=auth; }
    protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain) throws ServletException,IOException {
        String header=req.getHeader("Authorization");
        if(header!=null && header.startsWith("Bearer ") && header.length()<512) {
            try { var s=auth.authenticate(header.substring(7));SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(s,null,List.of())); }
            catch(ApiException e) { /* Security entry point returns a safe 401 below. */ }
        }
        chain.doFilter(req,res);
    }
}
