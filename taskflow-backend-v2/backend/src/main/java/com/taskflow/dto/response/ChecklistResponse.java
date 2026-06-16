package com.taskflow.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ChecklistResponse {
    private Long id;
    private String title;
    private Boolean isCompleted;
    private Integer positionIndex;
}
