package com.taskflow.controller;

import com.taskflow.dto.response.*;
import com.taskflow.security.SecurityUtils;
import com.taskflow.service.PomodoroService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/pomodoro")
@RequiredArgsConstructor
@Tag(name = "Pomodoro", description = "Pomodoro timer endpoints")
public class PomodoroController {

    private final PomodoroService pomodoroService;
    private final SecurityUtils securityUtils;

    @PostMapping("/start")
    public ResponseEntity<ApiResponse<PomodoroSessionResponse>> startSession(@RequestBody Map<String, Object> body) {
        Long userId = securityUtils.getCurrentUserId();
        Long taskId = body.get("taskId") != null ? Long.parseLong(body.get("taskId").toString()) : null;
        Integer workDuration = body.get("workDuration") != null ? Integer.parseInt(body.get("workDuration").toString()) : 25;
        Integer breakDuration = body.get("breakDuration") != null ? Integer.parseInt(body.get("breakDuration").toString()) : 5;
        return ResponseEntity.ok(ApiResponse.success("Session started",
                pomodoroService.startSession(userId, taskId, (String) body.get("mode"), workDuration, breakDuration)));
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<ApiResponse<PomodoroSessionResponse>> completeSession(
            @PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        Integer interruptions = body != null && body.get("interruptions") != null
                ? Integer.parseInt(body.get("interruptions").toString()) : 0;
        String notes = body != null ? (String) body.get("notes") : null;
        return ResponseEntity.ok(ApiResponse.success("Session completed",
                pomodoroService.completeSession(id, interruptions, notes)));
    }

    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse<List<PomodoroSessionResponse>>> getSessions() {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(pomodoroService.getUserSessions(userId)));
    }

    @GetMapping("/today/count")
    public ResponseEntity<ApiResponse<Long>> getTodayCount() {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(pomodoroService.getTodaySessionCount(userId)));
    }

    @GetMapping("/today/focus-minutes")
    public ResponseEntity<ApiResponse<Long>> getTodayFocusMinutes() {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(pomodoroService.getTodayFocusMinutes(userId)));
    }
}
