package com.taskflow.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class HabitResponse {
    private Long id;
    private String name;
    private String description;
    private String icon;
    private String color;
    private String frequency;
    private Integer targetDaysPerWeek;
    private LocalTime reminderTime;
    private Boolean isActive;
    private Integer currentStreak;
    private Integer longestStreak;
    private Integer totalCompletions;
    private Double completionRate;
    private Boolean completedToday;
    private LocalDateTime createdAt;
}
