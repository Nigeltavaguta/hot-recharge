package com.hotrecharge.app;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.hotrecharge.app.security.RequestContextFilter;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.servlet.HandlerMapping;
import static org.junit.jupiter.api.Assertions.*;

class RequestLoggingTest {
    @Test void requestLogsUseTemplatesAndCorrelationWithoutSensitiveInputs() throws Exception {
        Logger logger=(Logger)LoggerFactory.getLogger(RequestContextFilter.class);
        ListAppender<ILoggingEvent> logs=new ListAppender<>();logs.start();logger.addAppender(logs);
        try {
            var request=new MockHttpServletRequest("GET","/api/transactions/private-reference");
            request.setQueryString("password=private-password");
            request.addHeader("Authorization","Bearer private-token");
            request.setAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE,"/api/transactions/{id}");
            var response=new MockHttpServletResponse();
            new RequestContextFilter().doFilter(request,response,(req,res)->{
                assertEquals(response.getHeader("X-Correlation-Id"),MDC.get("correlationId"));
                response.setStatus(502);
            });
            assertNull(MDC.get("correlationId"));
            var event=logs.list.getFirst();
            assertEquals("ERROR",event.getLevel().toString());
            String fields=event.getKeyValuePairs().toString();
            assertTrue(fields.contains("/api/transactions/{id}"));assertTrue(fields.contains("502"));
            assertFalse(fields.contains("private-"));assertFalse(event.getFormattedMessage().contains("private-"));
        } finally {logger.detachAppender(logs);logs.stop();}
    }
}
