package com.hotrecharge.app.client;

import com.hotrecharge.app.model.PurchaseState;

/** No token/PIN/customer-key guesses. Provider-specific artifact mapping remains a release gate. */
final class ProviderResultAdapter {
    HotV3Client.Result fromRecharge(HotV3Dtos.RechargeResponse wire) {
        if(wire!=null && Boolean.TRUE.equals(wire.successful()) && wire.rechargeId()!=null)
            return new HotV3Client.Result(PurchaseState.CONFIRMED_SUCCESS,wire.rechargeId().toString(),null,null,null,"Purchase confirmed; artifact delivery mapping requires verification.");
        // False alone is insufficient to distinguish a definitive rejection from provider pending codes.
        return new HotV3Client.Result(PurchaseState.UNKNOWN,null,null,null,null,"Verify the original reference. Provider failure/pending mapping is not approved.");
    }
}
