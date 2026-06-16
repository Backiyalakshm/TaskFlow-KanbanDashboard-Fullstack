package com.taskflow.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class WorkspaceResponse {
    private Long id;
    private String name;
    private String description;
    private String slug;
    private UserResponse owner;
    private String logoUrl;
    private String color;
    private Boolean isPersonal;
    private LocalDateTime createdAt;
}
