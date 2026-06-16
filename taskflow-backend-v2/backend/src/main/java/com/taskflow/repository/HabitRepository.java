package com.taskflow.repository;

import com.taskflow.entity.Habit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HabitRepository extends JpaRepository<Habit, Long> {
    List<Habit> findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(Long userId);
    List<Habit> findByUserId(Long userId);
}
