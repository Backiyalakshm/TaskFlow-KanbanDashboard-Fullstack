package com.taskflow.dto.response;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class StudySessionResponse {
    private Long id;
    private String subject;
    private String topic;
    private Double hoursStudied;
    private Integer problemsSolved;
    private String notes;
    private String resources;
    private String difficulty;
    private LocalDate sessionDate;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private LocalDateTime createdAt;
}
