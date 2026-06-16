package com.taskflow.dto.response;

import lombok.*;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DashboardResponse {
    private UserResponse user;
    private Long tasksCompletedToday;
    private Long pendingTasks;
    private Long tasksDueToday;
    private Long upcomingTasks;
    private Double productivityScore;
    private Long pomodoroSessionsToday;
    private Long focusMinutesToday;
    private Long habitStreakMax;
    private Long habitsCompletedToday;
    private Long totalHabits;
    private Double studyHoursThisWeek;
    private List<TaskResponse> dueTodayTasks;
    private List<HabitResponse> todayHabits;
    private List<NotificationResponse> recentNotifications;
}
