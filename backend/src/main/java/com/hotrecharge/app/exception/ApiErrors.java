package com.hotrecharge.app.exception;

import java.util.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class ApiErrors {
    private static final org.slf4j.Logger LOG=org.slf4j.LoggerFactory.getLogger(ApiErrors.class);
    @ExceptionHandler(ApiException.class)
    ResponseEntity<?> api(ApiException e) {
        LOG.atLevel(e.status>=500?org.slf4j.event.Level.ERROR:org.slf4j.event.Level.WARN)
            .addKeyValue("event","api_error").addKeyValue("status",e.status).addKeyValue("errorCode",e.code)
            .log("API request rejected");
        return response(e.status,e.code,e.getMessage());
    }
    @ExceptionHandler({MethodArgumentNotValidException.class, org.springframework.http.converter.HttpMessageNotReadableException.class, org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class,org.springframework.web.bind.MissingRequestHeaderException.class})
    ResponseEntity<?> invalid(Exception e) {
        LOG.atWarn().addKeyValue("event","invalid_request").addKeyValue("exceptionType",e.getClass().getSimpleName()).log("Invalid API request");
        return response(400,"INVALID_REQUEST","Check the request fields.");
    }
    @ExceptionHandler(Exception.class)
    ResponseEntity<?> unexpected(Exception e) {
        // Exception messages and causes can contain SQL values, provider bodies or credentials.
        var frames=Arrays.stream(e.getStackTrace()).filter(f->f.getClassName().startsWith("com.hotrecharge.app."))
            .limit(8).map(StackTraceElement::toString).toList();
        LOG.atError().addKeyValue("event","unexpected_error").addKeyValue("exceptionType",e.getClass().getName())
            .addKeyValue("applicationFrames",frames).log("Unexpected API failure");
        return response(500,"INTERNAL_ERROR","Request could not be completed. Check purchase status before trying again.");
    }
    private ResponseEntity<?> response(int status,String code,String message) {
        String correlation=org.slf4j.MDC.get("correlationId");
        return ResponseEntity.status(status).body(Map.of("code",code,"message",message,"correlationId",correlation==null?UUID.randomUUID().toString():correlation));
    }
}
