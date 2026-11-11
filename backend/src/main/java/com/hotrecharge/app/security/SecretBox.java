package com.hotrecharge.app.security;

import com.hotrecharge.app.config.HotConfig;
import java.security.*;
import java.util.*;
import java.nio.charset.StandardCharsets;
import javax.crypto.Cipher;
import javax.crypto.spec.*;
import org.springframework.stereotype.Component;

@Component
public class SecretBox {
    private final byte[] key;
    private final SecureRandom random=new SecureRandom();
    public SecretBox(HotConfig config) {
        try { key=Base64.getDecoder().decode(config.encryptionKey); } catch(Exception e) { throw new IllegalStateException("Invalid encryption key"); }
        if(key.length!=32) throw new IllegalStateException("Encryption key must be 32 bytes");
    }
    public String seal(String plain) {
        try {
            byte[] nonce=new byte[12]; random.nextBytes(nonce);
            Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE,new SecretKeySpec(key,"AES"),new GCMParameterSpec(128,nonce));
            byte[] encrypted=cipher.doFinal(plain.getBytes(StandardCharsets.UTF_8));
            byte[] result=new byte[12+encrypted.length]; System.arraycopy(nonce,0,result,0,12); System.arraycopy(encrypted,0,result,12,encrypted.length);
            return Base64.getEncoder().encodeToString(result);
        } catch(Exception e) { throw new IllegalStateException("Encryption unavailable"); }
    }
    public String open(String encoded) {
        try {
            byte[] bytes=Base64.getDecoder().decode(encoded);
            Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE,new SecretKeySpec(key,"AES"),new GCMParameterSpec(128,Arrays.copyOfRange(bytes,0,12)));
            return new String(cipher.doFinal(Arrays.copyOfRange(bytes,12,bytes.length)),StandardCharsets.UTF_8);
        } catch(Exception e) { throw new IllegalStateException("Stored credential unavailable"); }
    }
    public String token() { byte[] bytes=new byte[32]; random.nextBytes(bytes); return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes); }
    public static String hash(String value) {
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8))); }
        catch(Exception e) { throw new IllegalStateException("Hash unavailable"); }
    }
}
