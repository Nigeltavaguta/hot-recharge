package com.hotrecharge.app.security;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.*;

/** Development baseline; edge/shared limits are required before multi-instance live use. */
@Component
public class RateLimitFilter extends OncePerRequestFilter {
    private record Window(long start,int count) {}
    private final Map<String,Window> windows=new LinkedHashMap<>();
    private synchronized boolean permit(String ip) {
        long now=System.currentTimeMillis();Window w=windows.get(ip);
        if(w==null||now-w.start>60000)w=new Window(now,0);
        if(w.count>=30)return false;
        if(windows.size()>=10000&&!windows.containsKey(ip))return false;
        windows.put(ip,new Window(w.start,w.count+1));windows.entrySet().removeIf(e->now-e.getValue().start>60000);return true;
    }
    protected void doFilterInternal(HttpServletRequest req,HttpServletResponse res,FilterChain chain)throws ServletException,IOException {
        if(req.getMethod().equals("POST")&&req.getRequestURI().startsWith("/api/auth/")&&!permit(req.getRemoteAddr())) {
            res.setStatus(429);res.setContentType("application/json");res.getWriter().write("{\"code\":\"RATE_LIMITED\",\"message\":\"Wait before trying again.\"}");return;
        }chain.doFilter(req,res);
    }
}
