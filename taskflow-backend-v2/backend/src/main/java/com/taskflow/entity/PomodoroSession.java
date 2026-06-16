package com.taskflow.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "pomodoro_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PomodoroSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    private Task task;

    @Column(length = 20)
    private String mode = "CLASSIC";

    @Column(name = "work_duration")
    private Integer workDuration = 25;

    @Column(name = "break_duration")
    private Integer breakDuration = 5;

    @Column(length = 20)
    private String status = "COMPLETED";

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "interruptions")
    private Integer interruptions = 0;

    @Column(name = "focus_score")
    private Double focusScore;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "session_date")
    private LocalDate sessionDate;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}
