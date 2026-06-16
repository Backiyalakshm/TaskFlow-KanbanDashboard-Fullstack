package com.taskflow.repository;

import com.taskflow.entity.HabitLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface HabitLogRepository extends JpaRepository<HabitLog, Long> {

    Optional<HabitLog> findByHabitIdAndLogDate(Long habitId, LocalDate logDate);

    List<HabitLog> findByHabitIdAndLogDateBetweenOrderByLogDateDesc(Long habitId, LocalDate start, LocalDate end);

    @Query("SELECT hl FROM HabitLog hl WHERE hl.user.id = :userId AND hl.logDate = :date")
    List<HabitLog> findByUserIdAndDate(@Param("userId") Long userId, @Param("date") LocalDate date);

    @Query("SELECT hl FROM HabitLog hl WHERE hl.user.id = :userId AND hl.logDate BETWEEN :start AND :end ORDER BY hl.logDate DESC")
    List<HabitLog> findByUserIdAndDateRange(@Param("userId") Long userId,
                                              @Param("start") LocalDate start,
                                              @Param("end") LocalDate end);

    @Query("SELECT COUNT(hl) FROM HabitLog hl WHERE hl.habit.id = :habitId AND hl.isCompleted = true AND hl.logDate >= :since")
    Long countCompletionsSince(@Param("habitId") Long habitId, @Param("since") LocalDate since);
}
