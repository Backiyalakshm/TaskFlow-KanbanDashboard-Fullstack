package com.taskflow.repository;

import com.taskflow.entity.StudySession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface StudySessionRepository extends JpaRepository<StudySession, Long> {
    List<StudySession> findByUserIdOrderBySessionDateDesc(Long userId);

    List<StudySession> findByUserIdAndSessionDateBetweenOrderBySessionDateDesc(Long userId, LocalDate start, LocalDate end);

    @Query("SELECT s.subject, SUM(s.hoursStudied) FROM StudySession s WHERE s.user.id = :userId GROUP BY s.subject")
    List<Object[]> getHoursPerSubject(@Param("userId") Long userId);

    @Query("SELECT SUM(s.hoursStudied) FROM StudySession s WHERE s.user.id = :userId AND s.sessionDate >= :since")
    Double getTotalHoursSince(@Param("userId") Long userId, @Param("since") LocalDate since);
}
