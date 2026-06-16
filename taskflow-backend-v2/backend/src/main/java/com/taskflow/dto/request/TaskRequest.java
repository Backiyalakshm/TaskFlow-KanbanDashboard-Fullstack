package com.taskflow.dto.request;

import com.taskflow.entity.Task;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class TaskRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Board ID is required")
    private Long boardId;

    @NotNull(message = "Column ID is required")
    private Long columnId;

    private Long parentTaskId;
    private Long assigneeId;
    private Task.Priority priority = Task.Priority.MEDIUM;
    private LocalDateTime dueDate;
    private LocalDateTime startDate;
    private Double estimatedHours;
    private Integer storyPoints;
    private Boolean isRecurring = false;
    private String recurrenceRule;
    private List<Long> labelIds;
}
