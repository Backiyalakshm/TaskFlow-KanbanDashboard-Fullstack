package com.taskflow.dto.response;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class LabelResponse {
    private Long id;
    private String name;
    private String color;
}
