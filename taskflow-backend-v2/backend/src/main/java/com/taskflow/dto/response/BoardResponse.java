package com.taskflow.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BoardResponse {
    private Long id;
    private String name;
    private String description;
    private Long workspaceId;
    private UserResponse owner;
    private String backgroundColor;
    private Boolean isStarred;
    private Boolean isArchived;
    private String visibility;
    private Integer positionIndex;
    private List<BoardColumnResponse> columns;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
