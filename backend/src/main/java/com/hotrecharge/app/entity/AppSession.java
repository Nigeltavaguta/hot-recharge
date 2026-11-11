package com.hotrecharge.app.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity @Table(name="app_session")
public class AppSession {
    @Id public String id;
    @Column(nullable=false) public String owner;
    @Column(nullable=false,unique=true) public String accessHash;
    @Column(nullable=false,unique=true) public String refreshHash;
    @Column(nullable=false,length=16384) public String providerSecret;
    @Column(nullable=false,length=4096) public String userJson;
    @Column(nullable=false) public Instant accessExpires;
    @Column(nullable=false) public Instant refreshExpires;
    @Column(nullable=false) public boolean revoked;
    @Version public long version;
}
