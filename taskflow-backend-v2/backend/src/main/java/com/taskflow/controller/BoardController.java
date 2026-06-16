package com.taskflow.controller;

import com.taskflow.dto.response.*;
import com.taskflow.security.SecurityUtils;
import com.taskflow.service.BoardService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/boards")
@RequiredArgsConstructor
@Tag(name = "Boards", description = "Kanban board endpoints")
public class BoardController {

    private final BoardService boardService;
    private final SecurityUtils securityUtils;

    @PostMapping
    public ResponseEntity<ApiResponse<BoardResponse>> createBoard(@RequestBody Map<String, Object> body) {
        Long userId = securityUtils.getCurrentUserId();
        String name = (String) body.get("name");
        String description = (String) body.get("description");
        Long workspaceId = Long.parseLong(body.get("workspaceId").toString());
        return ResponseEntity.ok(ApiResponse.success("Board created",
                boardService.createBoard(name, description, workspaceId, userId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BoardResponse>> getBoard(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(boardService.getBoardById(id)));
    }

    @GetMapping("/workspace/{workspaceId}")
    public ResponseEntity<ApiResponse<List<BoardResponse>>> getBoardsByWorkspace(@PathVariable Long workspaceId) {
        return ResponseEntity.ok(ApiResponse.success(boardService.getBoardsByWorkspace(workspaceId)));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<BoardResponse>>> getMyBoards() {
        Long userId = securityUtils.getCurrentUserId();
        return ResponseEntity.ok(ApiResponse.success(boardService.getMyBoards(userId)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BoardResponse>> updateBoard(@PathVariable Long id,
                                                                   @RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        String description = (String) body.get("description");
        Boolean isStarred = body.get("isStarred") != null ? (Boolean) body.get("isStarred") : null;
        return ResponseEntity.ok(ApiResponse.success("Board updated",
                boardService.updateBoard(id, name, description, isStarred)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBoard(@PathVariable Long id) {
        boardService.deleteBoard(id);
        return ResponseEntity.ok(ApiResponse.success("Board deleted", null));
    }
}
