package com.hotrecharge.app.exception;

import java.util.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class ApiErrors {
    @ExceptionHandler(ApiException.class)
    ResponseEntity<?> api(ApiException e) { return response(e.status,e.code,e.getMessage()); }
    @ExceptionHandler({MethodArgumentNotValidException.class, org.springframework.http.converter.HttpMessageNotReadableException.class, org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class,org.springframework.web.bind.MissingRequestHeaderException.class})
    ResponseEntity<?> invalid(Exception e) { return response(400,"INVALID_REQUEST","Check the request fields."); }
    @ExceptionHandler(Exception.class)
    ResponseEntity<?> unexpected(Exception e) { return response(500,"INTERNAL_ERROR","Request could not be completed. Check purchase status before trying again."); }
    private ResponseEntity<?> response(int status,String code,String message) {
        String correlation=org.slf4j.MDC.get("correlationId");
        return ResponseEntity.status(status).body(Map.of("code",code,"message",message,"correlationId",correlation==null?UUID.randomUUID().toString():correlation));
    }
}
