package com.hotrecharge.app.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.slf4j.MDC;
import java.io.IOException;
import java.util.UUID;

@Component("hotCorrelationFilter") @Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestContextFilter extends OncePerRequestFilter {
    protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain)throws ServletException,IOException {
        String id=UUID.randomUUID().toString();MDC.put("correlationId",id);res.setHeader("X-Correlation-Id",id);
        try {chain.doFilter(req,res);} finally {MDC.remove("correlationId");}
    }
}
