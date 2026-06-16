package com.taskflow.controller;

import com.taskflow.dto.response.*;
import com.taskflow.security.SecurityUtils;
import com.taskflow.service.WorkspaceService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/workspaces")
@RequiredArgsConstructor
@Tag(name = "Workspaces", description = "Workspace endpoints")
public class WorkspaceController {

    private final WorkspaceService workspaceService;
    private final SecurityUtils securityUtils;

    @GetMapping
    public ResponseEntity<ApiResponse<List<WorkspaceResponse>>> getWorkspaces() {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(workspaceService.getUserWorkspaces(userId)));
    }

    @GetMapping("/personal")
    public ResponseEntity<ApiResponse<WorkspaceResponse>> getPersonal() {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(workspaceService.getOrCreatePersonalWorkspace(userId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WorkspaceResponse>> getWorkspace(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(workspaceService.getWorkspaceById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<WorkspaceResponse>> createWorkspace(@RequestBody Map<String, Object> body) {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Workspace created",
                workspaceService.createWorkspace(userId, (String) body.get("name"),
                        (String) body.get("description"), (String) body.get("color"))));
    }
}
