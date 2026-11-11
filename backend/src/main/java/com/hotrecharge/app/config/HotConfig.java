package com.hotrecharge.app.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class HotConfig {
    @Value("${hot.mode}") public String mode;
    @Value("${hot.transactions-enabled}") public boolean transactionsEnabled;
    @Value("${hot.base-url}") public String baseUrl;
    @Value("${hot.encryption-key}") public String encryptionKey;
    @Value("${hot.connect-timeout-ms}") public int connectTimeout;
    @Value("${hot.read-timeout-ms}") public int readTimeout;
    @Value("${hot.allowed-origins}") public String allowedOrigins;
    @Value("${hot.allowed-hosts:ssl.hot.co.zw}") public String allowedHosts;
    @PostConstruct void validate() {
        if (!mode.equals("stub") && !mode.equals("live")) throw new IllegalStateException("HOT_CLIENT_MODE must be stub or live");
        java.net.URI uri=java.net.URI.create(baseUrl);
        if(!"https".equals(uri.getScheme())||uri.getUserInfo()!=null||uri.getFragment()!=null||uri.getQuery()!=null||uri.getHost()==null||
            !java.util.Arrays.asList(allowedHosts.split(",")).contains(uri.getHost())||(uri.getPort()!=-1&&uri.getPort()!=443))
            throw new IllegalStateException("HOT base URL must use HTTPS and an explicitly approved host");
        if (connectTimeout < 100 || readTimeout < 100 || readTimeout > 60000) throw new IllegalStateException("Invalid timeout");
        if (encryptionKey.isBlank()) throw new IllegalStateException("APP_CREDENTIAL_ENCRYPTION_KEY (base64 32 bytes) is required");
        // Deliberately fail closed until unverified provider status/fee/artifact mappings are approved.
        if (mode.equals("live") && transactionsEnabled) throw new IllegalStateException("Live purchases require verified provider contract; not enabled in this release");
    }
}
