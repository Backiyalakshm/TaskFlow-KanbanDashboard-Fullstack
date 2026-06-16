package com.taskflow.service;

import com.taskflow.dto.response.HabitResponse;
import com.taskflow.entity.*;
import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HabitService {

    private final HabitRepository habitRepository;
    private final HabitLogRepository habitLogRepository;
    private final UserRepository userRepository;

    @Transactional
    public HabitResponse createHabit(String name, String description, String icon, String color,
                                      String frequency, Integer targetDaysPerWeek, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Habit habit = Habit.builder()
                .user(user)
                .name(name)
                .description(description)
                .icon(icon != null ? icon : "⚡")
                .color(color != null ? color : "#6366f1")
                .frequency(frequency != null ? frequency : "DAILY")
                .targetDaysPerWeek(targetDaysPerWeek != null ? targetDaysPerWeek : 7)
                .isActive(true)
                .currentStreak(0)
                .longestStreak(0)
                .totalCompletions(0)
                .completionRate(0.0)
                .build();

        habit = habitRepository.save(habit);
        return mapToResponse(habit, userId);
    }

    @Transactional(readOnly = true)
    public List<HabitResponse> getUserHabits(Long userId) {
        return habitRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(userId)
                .stream()
                .map(h -> mapToResponse(h, userId))
                .collect(Collectors.toList());
    }

    @Transactional
    public HabitResponse toggleHabitCompletion(Long habitId, Long userId) {
        Habit habit = habitRepository.findById(habitId)
                .orElseThrow(() -> new ResourceNotFoundException("Habit not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        LocalDate today = LocalDate.now();
        Optional<HabitLog> existingLog = habitLogRepository.findByHabitIdAndLogDate(habitId, today);

        if (existingLog.isPresent()) {
            HabitLog log = existingLog.get();
            log.setIsCompleted(!log.getIsCompleted());
            if (log.getIsCompleted()) {
                log.setCompletedAt(java.time.LocalDateTime.now());
                habit.setTotalCompletions(habit.getTotalCompletions() + 1);
            } else {
                log.setCompletedAt(null);
                habit.setTotalCompletions(Math.max(0, habit.getTotalCompletions() - 1));
            }
            habitLogRepository.save(log);
        } else {
            HabitLog log = HabitLog.builder()
                    .habit(habit)
                    .user(user)
                    .logDate(today)
                    .isCompleted(true)
                    .completedAt(java.time.LocalDateTime.now())
                    .build();
            habitLogRepository.save(log);
            habit.setTotalCompletions(habit.getTotalCompletions() + 1);
        }

        // Recalculate streak
        updateStreak(habit);
        habit = habitRepository.save(habit);
        return mapToResponse(habit, userId);
    }

    private void updateStreak(Habit habit) {
        int streak = 0;
        LocalDate date = LocalDate.now();

        for (int i = 0; i < 365; i++) {
            LocalDate checkDate = date.minusDays(i);
            Optional<HabitLog> log = habitLogRepository.findByHabitIdAndLogDate(habit.getId(), checkDate);
            if (log.isPresent() && log.get().getIsCompleted()) {
                streak++;
            } else if (i > 0) {
                break;
            }
        }

        habit.setCurrentStreak(streak);
        if (streak > habit.getLongestStreak()) {
            habit.setLongestStreak(streak);
        }

        // Calculate completion rate (last 30 days)
        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);
        long completions = habitLogRepository.countCompletionsSince(habit.getId(), thirtyDaysAgo);
        habit.setCompletionRate(Math.min(100.0, (completions / 30.0) * 100.0));
    }

    @Transactional
    public void deleteHabit(Long habitId) {
        habitRepository.deleteById(habitId);
    }

    @Transactional(readOnly = true)
    public List<java.util.Map<String, Object>> getHabitHeatmap(Long habitId, Long userId) {
        LocalDate start = LocalDate.now().minusDays(364);
        LocalDate end = LocalDate.now();
        List<HabitLog> logs = habitLogRepository.findByHabitIdAndLogDateBetweenOrderByLogDateDesc(habitId, start, end);

        return logs.stream().map(log -> {
            java.util.Map<String, Object> entry = new java.util.HashMap<>();
            entry.put("date", log.getLogDate().toString());
            entry.put("completed", log.getIsCompleted());
            return entry;
        }).collect(Collectors.toList());
    }

    public HabitResponse mapToResponse(Habit habit, Long userId) {
        Optional<HabitLog> todayLog = habitLogRepository.findByHabitIdAndLogDate(habit.getId(), LocalDate.now());
        boolean completedToday = todayLog.isPresent() && todayLog.get().getIsCompleted();

        return HabitResponse.builder()
                .id(habit.getId())
                .name(habit.getName())
                .description(habit.getDescription())
                .icon(habit.getIcon())
                .color(habit.getColor())
                .frequency(habit.getFrequency())
                .targetDaysPerWeek(habit.getTargetDaysPerWeek())
                .reminderTime(habit.getReminderTime())
                .isActive(habit.getIsActive())
                .currentStreak(habit.getCurrentStreak())
                .longestStreak(habit.getLongestStreak())
                .totalCompletions(habit.getTotalCompletions())
                .completionRate(habit.getCompletionRate())
                .completedToday(completedToday)
                .createdAt(habit.getCreatedAt())
                .build();
    }
}
