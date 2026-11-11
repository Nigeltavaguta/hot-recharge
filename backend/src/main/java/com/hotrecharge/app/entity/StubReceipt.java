package com.hotrecharge.app.entity;

import jakarta.persistence.*;

/** Durable simulation record, never a financial ledger. */
@Entity @Table(name="stub_receipt")
public class StubReceipt {
    @Id public String reference;
    @Column(nullable=false,length=16384) public String resultSecret;
}
