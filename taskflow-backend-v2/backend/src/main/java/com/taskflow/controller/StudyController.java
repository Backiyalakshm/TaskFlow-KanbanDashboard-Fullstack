package com.taskflow.controller;

import com.taskflow.dto.response.*;
import com.taskflow.security.SecurityUtils;
import com.taskflow.service.StudyService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/study")
@RequiredArgsConstructor
@Tag(name = "Study", description = "Study tracker endpoints")
public class StudyController {

    private final StudyService studyService;
    private final SecurityUtils securityUtils;

    @PostMapping("/sessions")
    public ResponseEntity<ApiResponse<StudySessionResponse>> createSession(@RequestBody Map<String, Object> body) {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Session created", studyService.createSession(
                userId,
                (String) body.get("subject"),
                (String) body.get("topic"),
                body.get("hoursStudied") != null ? Double.parseDouble(body.get("hoursStudied").toString()) : 0.0,
                body.get("problemsSolved") != null ? Integer.parseInt(body.get("problemsSolved").toString()) : 0,
                (String) body.get("notes"),
                (String) body.get("difficulty")
        )));
    }

    @GetMapping("/sessions")
    public ResponseEntity<ApiResponse<List<StudySessionResponse>>> getSessions() {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(studyService.getUserSessions(userId)));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getStats() {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(studyService.getSubjectStats(userId)));
    }

    @GetMapping("/weekly-hours")
    public ResponseEntity<ApiResponse<Double>> getWeeklyHours() {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(studyService.getWeeklyHours(userId)));
    }

    @DeleteMapping("/sessions/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSession(@PathVariable Long id) {
        studyService.deleteSession(id);
        return ResponseEntity.ok(ApiResponse.success("Session deleted", null));
    }
}
