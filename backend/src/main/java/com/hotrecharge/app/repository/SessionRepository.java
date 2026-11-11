package com.hotrecharge.app.repository;

import com.hotrecharge.app.entity.AppSession;
import org.springframework.data.jpa.repository.*;
import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface SessionRepository extends JpaRepository<AppSession,String> {
    Optional<AppSession> findByAccessHash(String hash);
    Optional<AppSession> findFirstByOwnerAndRevokedFalseAndRefreshExpiresAfterOrderByRefreshExpiresDesc(String owner,java.time.Instant now);
    @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select s from AppSession s where s.refreshHash=:hash")
    Optional<AppSession> lockRefresh(String hash);
    @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select s from AppSession s where s.id=:id")
    Optional<AppSession> lock(String id);
}
