package com.taskflow.dto.response;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PomodoroSessionResponse {
    private Long id;
    private Long taskId;
    private String taskTitle;
    private String mode;
    private Integer workDuration;
    private Integer breakDuration;
    private String status;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private Integer interruptions;
    private Double focusScore;
    private String notes;
    private LocalDate sessionDate;
    private LocalDateTime createdAt;
}
