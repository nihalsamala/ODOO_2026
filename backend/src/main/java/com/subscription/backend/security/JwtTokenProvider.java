package com.subscription.backend.security;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtTokenProvider {

    private final String secretKey;
    private final long expirationMs;
    private final ObjectMapper objectMapper;

    public JwtTokenProvider(
            @Value("${app.jwt.secret:subscriptiq-super-secure-secret-key-for-jwt-signing-2026-hackathon}") String secretKey,
            @Value("${app.jwt.expiration-ms:86400000}") long expirationMs,
            ObjectMapper objectMapper) {
        this.secretKey = secretKey;
        this.expirationMs = expirationMs;
        this.objectMapper = objectMapper;
    }

    public String generateToken(String email, Role role, Long userId, Long customerId) {
        try {
            long now = Instant.now().getEpochSecond();
            long exp = now + (expirationMs / 1000);

            Map<String, Object> header = new HashMap<>();
            header.put("alg", "HS256");
            header.put("typ", "JWT");

            Map<String, Object> payload = new HashMap<>();
            payload.put("sub", email);
            payload.put("role", role.name());
            payload.put("userId", userId);
            if (customerId != null) {
                payload.put("customerId", customerId);
            }
            payload.put("iat", now);
            payload.put("exp", exp);

            String encodedHeader = base64UrlEncode(objectMapper.writeValueAsString(header).getBytes(StandardCharsets.UTF_8));
            String encodedPayload = base64UrlEncode(objectMapper.writeValueAsString(payload).getBytes(StandardCharsets.UTF_8));

            String content = encodedHeader + "." + encodedPayload;
            String signature = sign(content, secretKey);

            return content + "." + signature;
        } catch (Exception e) {
            throw new RuntimeException("Error generating JWT token", e);
        }
    }

    public boolean validateToken(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return false;
            }

            String content = parts[0] + "." + parts[1];
            String expectedSignature = sign(content, secretKey);

            if (!MessageDigest.isEqual(parts[2].getBytes(StandardCharsets.UTF_8), expectedSignature.getBytes(StandardCharsets.UTF_8))) {
                return false;
            }

            Map<String, Object> claims = getClaims(token);
            Number exp = (Number) claims.get("exp");
            if (exp != null && Instant.now().getEpochSecond() > exp.longValue()) {
                return false;
            }

            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String getEmailFromToken(String token) {
        Map<String, Object> claims = getClaims(token);
        return (String) claims.get("sub");
    }

    public Role getRoleFromToken(String token) {
        Map<String, Object> claims = getClaims(token);
        String roleStr = (String) claims.get("role");
        return roleStr != null ? Role.valueOf(roleStr) : null;
    }

    public Long getCustomerIdFromToken(String token) {
        Map<String, Object> claims = getClaims(token);
        Object customerId = claims.get("customerId");
        if (customerId instanceof Number) {
            return ((Number) customerId).longValue();
        }
        return null;
    }

    public Long getUserIdFromToken(String token) {
        Map<String, Object> claims = getClaims(token);
        Object userId = claims.get("userId");
        if (userId instanceof Number) {
            return ((Number) userId).longValue();
        }
        return null;
    }

    private Map<String, Object> getClaims(String token) {
        try {
            String[] parts = token.split("\\.");
            byte[] decodedBytes = Base64.getUrlDecoder().decode(parts[1]);
            return objectMapper.readValue(decodedBytes, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse JWT claims", e);
        }
    }

    private String sign(String data, String secret) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(secretKeySpec);
        byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return base64UrlEncode(rawHmac);
    }

    private String base64UrlEncode(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
