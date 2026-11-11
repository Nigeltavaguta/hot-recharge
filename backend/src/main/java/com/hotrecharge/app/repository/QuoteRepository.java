package com.hotrecharge.app.repository;
import com.hotrecharge.app.entity.QuoteRecord;
import org.springframework.data.jpa.repository.*;
import jakarta.persistence.LockModeType;
import java.util.Optional;
public interface QuoteRepository extends JpaRepository<QuoteRecord,String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select q from QuoteRecord q where q.id=:id")
    Optional<QuoteRecord> lock(String id);
}
