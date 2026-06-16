package com.taskflow.dto.response;

import com.taskflow.entity.Task;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskResponse {
    private Long id;
    private String title;
    private String description;
    private Long boardId;
    private Long columnId;
    private Long parentTaskId;
    private UserResponse assignee;
    private UserResponse reporter;
    private Task.Priority priority;
    private Task.TaskStatus status;
    private String aiPriority;
    private String aiSuggestion;
    private LocalDateTime dueDate;
    private LocalDateTime startDate;
    private Double estimatedHours;
    private Double actualHours;
    private Integer positionIndex;
    private Boolean isRecurring;
    private Integer storyPoints;
    private Boolean isArchived;
    private LocalDateTime completedAt;
    private List<LabelResponse> labels;
    private List<ChecklistResponse> checklists;
    private List<CommentResponse> comments;
    private List<TaskResponse> subTasks;
    private int commentCount;
    private int attachmentCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
