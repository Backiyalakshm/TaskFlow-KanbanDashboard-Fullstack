package com.taskflow.repository;

import com.taskflow.entity.PomodoroSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PomodoroSessionRepository extends JpaRepository<PomodoroSession, Long> {

    List<PomodoroSession> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<PomodoroSession> findByUserIdAndSessionDateBetweenOrderBySessionDateDesc(Long userId, LocalDate start, LocalDate end);

    @Query("SELECT COUNT(p) FROM PomodoroSession p WHERE p.user.id = :userId AND p.status = 'COMPLETED' AND p.sessionDate >= :since")
    Long countCompletedSince(@Param("userId") Long userId, @Param("since") LocalDate since);

    @Query("SELECT SUM(p.workDuration) FROM PomodoroSession p WHERE p.user.id = :userId AND p.status = 'COMPLETED' AND p.sessionDate >= :since")
    Long getTotalFocusMinutes(@Param("userId") Long userId, @Param("since") LocalDate since);
}
