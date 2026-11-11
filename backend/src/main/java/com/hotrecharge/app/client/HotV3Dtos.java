package com.hotrecharge.app.client;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.util.List;

/** Documented upstream wire types, independent from the mobile contract. */
public final class HotV3Dtos {
    private HotV3Dtos() {}
    public record LoginRequest(@JsonProperty("AccessCode") String accessCode,@JsonProperty("Password") String password) {}
    public record RefreshRequest(String token,String refreshToken) {}
    public record LoginResponse(String token,String refreshToken) {}
    public record RechargeOption(@JsonProperty("Name") String name,@JsonProperty("ParameterType") String parameterType,@JsonProperty("Value") String value) {}
    public record RechargeRequest(@JsonProperty("AgentReference") String agentReference,@JsonProperty("ProductId") int productId,
                                  @JsonProperty("Target") String target,@JsonProperty("Amount") BigDecimal amount,
                                  @JsonProperty("RechargeOptions") List<RechargeOption> rechargeOptions) {}
    public record RechargeResponse(Boolean successful,Long rechargeId,BigDecimal amount,BigDecimal discount,JsonNode balance,String message,JsonNode rechargeData) {}
}
