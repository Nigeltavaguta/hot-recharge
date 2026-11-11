package com.hotrecharge.app.repository;
import com.hotrecharge.app.entity.PurchaseIntent;
import com.hotrecharge.app.model.PurchaseState;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.domain.Pageable;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.*;
public interface IntentRepository extends JpaRepository<PurchaseIntent,String> {
    Optional<PurchaseIntent> findByOwnerAndIdempotencyKey(String owner,String key);
    List<PurchaseIntent> findByOwnerOrderByCreatedAtDescIdDesc(String owner,Pageable page);
    List<PurchaseIntent> findByStateInAndUpdatedAtBefore(List<PurchaseState> states,Instant time,Pageable page);
    List<PurchaseIntent> findByStateInAndNextVerificationAtBefore(List<PurchaseState> states,Instant time,Pageable page);
    @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select i from PurchaseIntent i where i.id=:id")
    Optional<PurchaseIntent> lock(String id);
}
