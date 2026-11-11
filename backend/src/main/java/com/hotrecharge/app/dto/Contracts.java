package com.hotrecharge.app.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import jakarta.validation.constraints.*;

public final class Contracts {
    private Contracts() {}
    public record Login(@NotBlank @Pattern(regexp="07[1378][0-9]{7}") String mobile, @NotBlank @Size(max=256) String password) {}
    public record Refresh(@NotBlank @Size(max=256) String refreshToken) {}
    public record User(String accountId,String firstName,String lastName,String mobile,String email) {}
    public record Session(User user,String accessToken,String refreshToken,Instant expiresAt,boolean demonstration) {}
    public record Balance(String id,String name,String balance,String currency,Instant updatedAt) {}
    public record Product(String id,String category,String network,String name,String currency,String stockAccountId,
                          String minAmount,String maxAmount,String increment,List<String> requiredOptions,boolean customerLookupSupported) {}
    public record Stock(String id,String productId,String productCode,String name,String description,String price,String currency,String stockAccountId,String allowance,String validity) {}
    public record QuoteInput(@NotBlank String productId,@NotBlank @Size(max=100) String target,String amount,String productCode,Map<String,String> options) {}
    public record Quote(String id,Instant expiresAt,String category,String title,List<Map<String,String>> rows,
                        String amount,String fee,String total,String currency,String stockAccountId,String stockAccountName,String availableBalance,String target,boolean demonstration) {}
    public record Buy(@NotBlank String quoteId) {}
    public record MeterInput(@NotBlank String productId,@Pattern(regexp="[0-9]{11}") @NotBlank String meter) {}
    public record Page<T>(List<T> items,String nextCursor) {}
    public record Transaction(String id,String reference,String type,String title,String recipient,String amount,String fee,String currency,Instant date,String status,
                              String network,String token,String units,String pin,String message,String stockAccountId,String verificationState,boolean demonstration) {}
    public static BigDecimal money(String value) {
        if (value==null || !value.matches("[0-9]{1,10}(\\.[0-9]{1,2})?")) throw com.hotrecharge.app.exception.ApiException.invalid("Enter a valid amount with at most two decimal places.");
        return new BigDecimal(value).setScale(2);
    }
}
