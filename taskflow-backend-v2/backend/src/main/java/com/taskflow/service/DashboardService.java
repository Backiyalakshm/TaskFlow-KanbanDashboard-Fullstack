package com.taskflow.service;

import com.taskflow.dto.response.*;
import com.taskflow.entity.User;
import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final HabitRepository habitRepository;
    private final HabitLogRepository habitLogRepository;
    private final PomodoroSessionRepository pomodoroSessionRepository;
    private final StudySessionRepository studySessionRepository;
    private final NotificationRepository notificationRepository;
    private final TaskService taskService;
    private final HabitService habitService;
    private final AuthService authService;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        LocalDateTime startOfDay = LocalDateTime.now().truncatedTo(ChronoUnit.DAYS);
        LocalDateTime endOfDay = startOfDay.plusDays(1).minusSeconds(1);

        Long tasksCompletedToday = taskRepository.countCompletedSince(userId, startOfDay);
        Long pendingTasks = taskRepository.countPendingTasks(userId);
        List<TaskResponse> dueTodayTasks = taskService.getTasksDueToday(userId);
        Long tasksDueToday = (long) dueTodayTasks.size();

        LocalDateTime upcomingStart = LocalDateTime.now();
        LocalDateTime upcomingEnd = LocalDateTime.now().plusDays(7);
        Long upcomingTasks = (long) taskRepository.findUpcomingTasks(userId, upcomingStart, upcomingEnd).size();

        Long pomodoroToday = pomodoroSessionRepository.countCompletedSince(userId, LocalDate.now());
        Long focusMinutesToday = pomodoroSessionRepository.getTotalFocusMinutes(userId, LocalDate.now());

        List<com.taskflow.entity.Habit> habits = habitRepository.findByUserIdAndIsActiveTrueOrderByCreatedAtDesc(userId);
        long habitsCompletedToday = habits.stream()
                .filter(h -> habitLogRepository.findByHabitIdAndLogDate(h.getId(), LocalDate.now())
                        .map(log -> log.getIsCompleted()).orElse(false))
                .count();
        int maxStreak = habits.stream().mapToInt(h -> h.getCurrentStreak()).max().orElse(0);

        Double studyHoursWeek = studySessionRepository.getTotalHoursSince(userId, LocalDate.now().minusDays(7));

        List<HabitResponse> habitResponses = habits.stream()
                .map(h -> habitService.mapToResponse(h, userId))
                .collect(Collectors.toList());

        List<NotificationResponse> notifications = notificationRepository
                .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, 5))
                .stream()
                .map(n -> NotificationResponse.builder()
                        .id(n.getId())
                        .title(n.getTitle())
                        .message(n.getMessage())
                        .type(n.getType())
                        .isRead(n.getIsRead())
                        .createdAt(n.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        // Calculate productivity score
        double score = 0;
        if (tasksCompletedToday > 0) score += Math.min(40, tasksCompletedToday * 10);
        if (pomodoroToday != null && pomodoroToday > 0) score += Math.min(30, pomodoroToday * 10);
        if (habitsCompletedToday > 0) score += Math.min(30, habitsCompletedToday * 10);

        user.setProductivityScore(score);
        userRepository.save(user);

        return DashboardResponse.builder()
                .user(authService.mapToUserResponse(user))
                .tasksCompletedToday(tasksCompletedToday)
                .pendingTasks(pendingTasks)
                .tasksDueToday(tasksDueToday)
                .upcomingTasks(upcomingTasks)
                .productivityScore(score)
                .pomodoroSessionsToday(pomodoroToday != null ? pomodoroToday : 0)
                .focusMinutesToday(focusMinutesToday != null ? focusMinutesToday : 0)
                .habitStreakMax((long) maxStreak)
                .habitsCompletedToday(habitsCompletedToday)
                .totalHabits((long) habits.size())
                .studyHoursThisWeek(studyHoursWeek != null ? studyHoursWeek : 0.0)
                .dueTodayTasks(dueTodayTasks)
                .todayHabits(habitResponses)
                .recentNotifications(notifications)
                .build();
    }
}
