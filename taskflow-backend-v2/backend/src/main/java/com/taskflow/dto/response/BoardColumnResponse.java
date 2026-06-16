package com.taskflow.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class BoardColumnResponse {
    private Long id;
    private String title;
    private Long boardId;
    private Integer positionIndex;
    private String color;
    private Integer wipLimit;
    private Boolean isDoneColumn;
    private List<TaskResponse> tasks;
    private LocalDateTime createdAt;
}
