package com.taskflow.controller;

import com.taskflow.dto.response.*;
import com.taskflow.security.SecurityUtils;
import com.taskflow.service.HabitService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/habits")
@RequiredArgsConstructor
@Tag(name = "Habits", description = "Habit tracking endpoints")
public class HabitController {

    private final HabitService habitService;
    private final SecurityUtils securityUtils;

    @PostMapping
    public ResponseEntity<ApiResponse<HabitResponse>> createHabit(@RequestBody Map<String, Object> body) {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Habit created", habitService.createHabit(
                (String) body.get("name"),
                (String) body.get("description"),
                (String) body.get("icon"),
                (String) body.get("color"),
                (String) body.get("frequency"),
                body.get("targetDaysPerWeek") != null ? Integer.parseInt(body.get("targetDaysPerWeek").toString()) : 7,
                userId)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<HabitResponse>>> getHabits() {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(habitService.getUserHabits(userId)));
    }

    @PostMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<HabitResponse>> toggleHabit(@PathVariable Long id) {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success("Habit toggled", habitService.toggleHabitCompletion(id, userId)));
    }

    @GetMapping("/{id}/heatmap")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getHeatmap(@PathVariable Long id) {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(habitService.getHabitHeatmap(id, userId)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteHabit(@PathVariable Long id) {
        habitService.deleteHabit(id);
        return ResponseEntity.ok(ApiResponse.success("Habit deleted", null));
    }
}
