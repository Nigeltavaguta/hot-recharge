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
    private static final org.slf4j.Logger LOG=org.slf4j.LoggerFactory.getLogger(RequestContextFilter.class);
    protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain)throws ServletException,IOException {
        String id=UUID.randomUUID().toString();MDC.put("correlationId",id);res.setHeader("X-Correlation-Id",id);
        long started=System.nanoTime();
        boolean failed=false;
        try {chain.doFilter(req,res);} catch(ServletException|IOException|RuntimeException e) {failed=true;throw e;}
        finally {
            try {
                Object route=req.getAttribute(org.springframework.web.servlet.HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
                // Route templates exclude customer numbers, references and other path values.
                String template=route==null?"unmapped":route.toString();
                int status=failed?500:res.getStatus();
                if(!template.startsWith("/actuator/health") || status>=400)
                    LOG.atLevel(status>=500?org.slf4j.event.Level.ERROR:status>=400?org.slf4j.event.Level.WARN:org.slf4j.event.Level.INFO)
                        .addKeyValue("event","http_request_completed").addKeyValue("method",req.getMethod())
                        .addKeyValue("route",template).addKeyValue("status",status)
                        .addKeyValue("durationMs",(System.nanoTime()-started)/1_000_000).log("HTTP request completed");
            } finally {MDC.remove("correlationId");}
        }
    }
}
