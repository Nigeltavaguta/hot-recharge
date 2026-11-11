package com.hotrecharge.app.model;

public enum PurchaseState {
    CREATED, SUBMITTING, PENDING, UNKNOWN, CONFIRMED_SUCCESS, CONFIRMED_FAILURE;
    public boolean terminal() { return this==CONFIRMED_SUCCESS || this==CONFIRMED_FAILURE; }
}
