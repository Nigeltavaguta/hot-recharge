package com.hotrecharge.app.entity;

import com.hotrecharge.app.model.PurchaseState;
import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name="purchase_intent",uniqueConstraints=@UniqueConstraint(columnNames={"owner","idempotency_key"}))
public class PurchaseIntent {
    @Id public String id;
    @Column(nullable=false) public String owner;
    @Column(name="idempotency_key",nullable=false,length=100) public String idempotencyKey;
    @Column(nullable=false) public String quoteId;
    @Column(nullable=false,unique=true) public String reference;
    @Column(nullable=false,length=16384) public String payload;
    @Column(length=16384) public String resultSecret;
    @Enumerated(EnumType.STRING) @Column(nullable=false) public PurchaseState state;
    @Column(nullable=false) public Instant createdAt;
    @Column(nullable=false) public Instant updatedAt;
    public String sessionId;
    public int recoveryAttempts;
    public Instant nextVerificationAt;
    @Version public long version;
}
