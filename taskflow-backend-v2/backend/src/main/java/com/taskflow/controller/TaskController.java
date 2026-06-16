package com.taskflow.controller;

import com.taskflow.dto.request.TaskRequest;
import com.taskflow.dto.response.*;
import com.taskflow.security.SecurityUtils;
import com.taskflow.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/tasks")
@RequiredArgsConstructor
@Tag(name = "Tasks", description = "Task management endpoints")
public class TaskController {

    private final TaskService taskService;
    private final SecurityUtils securityUtils;

    @PostMapping
    @Operation(summary = "Create task")
    public ResponseEntity<ApiResponse<TaskResponse>> createTask(@Valid @RequestBody TaskRequest request) {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Task created", taskService.createTask(request, userId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskResponse>> getTask(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getTaskById(id)));
    }

    @GetMapping("/board/{boardId}")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getTasksByBoard(@PathVariable Long boardId) {
        return ResponseEntity.ok(ApiResponse.success(taskService.getTasksByBoard(boardId)));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getMyTasks() {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(taskService.getMyTasks(userId)));
    }

    @GetMapping("/due-today")
    public ResponseEntity<ApiResponse<List<TaskResponse>>> getDueToday() {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(taskService.getTasksDueToday(userId)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<TaskResponse>> updateTask(@PathVariable Long id,
                                                                 @RequestBody TaskRequest request) {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Task updated", taskService.updateTask(id, request, userId)));
    }

    @PatchMapping("/{id}/move")
    @Operation(summary = "Move task to different column")
    public ResponseEntity<ApiResponse<Void>> moveTask(@PathVariable Long id,
                                                       @RequestBody Map<String, Object> body) {
        Long columnId = Long.parseLong(body.get("columnId").toString());
        Integer position = Integer.parseInt(body.get("position").toString());
        taskService.moveTask(id, columnId, position);
        return ResponseEntity.ok(ApiResponse.success("Task moved", null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.ok(ApiResponse.success("Task deleted", null));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PageResponse<TaskResponse>>> searchTasks(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long userId = securityUtils.getCurrentUserId();
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(taskService.searchTasks(q, userId, pageable)));
    }
}
