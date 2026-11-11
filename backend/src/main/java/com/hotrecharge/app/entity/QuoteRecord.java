package com.hotrecharge.app.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name="purchase_quote")
public class QuoteRecord {
    @Id public String id;
    @Column(nullable=false) public String owner;
    @Column(nullable=false,length=16384) public String payload;
    @Column(nullable=false) public Instant expiresAt;
    @Column(nullable=false) public boolean consumed;
}
