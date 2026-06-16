package com.taskflow.service;

import com.taskflow.dto.response.*;
import com.taskflow.entity.*;
import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BoardService {

    private final BoardRepository boardRepository;
    private final BoardColumnRepository boardColumnRepository;
    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;
    private final TaskService taskService;
    private final AuthService authService;

    @Transactional
    public BoardResponse createBoard(String name, String description, Long workspaceId, Long userId) {
        Workspace workspace = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Board board = Board.builder()
                .name(name)
                .description(description)
                .workspace(workspace)
                .owner(owner)
                .backgroundColor("#1e1e2e")
                .isStarred(false)
                .isArchived(false)
                .visibility("PRIVATE")
                .build();
        board = boardRepository.save(board);

        // Create default columns
        List<String> defaultColumns = Arrays.asList("Backlog", "To Do", "In Progress", "Review", "Testing", "Done");
        for (int i = 0; i < defaultColumns.size(); i++) {
            BoardColumn col = BoardColumn.builder()
                    .title(defaultColumns.get(i))
                    .board(board)
                    .positionIndex(i)
                    .isDoneColumn(i == defaultColumns.size() - 1)
                    .build();
            boardColumnRepository.save(col);
        }

        Board savedBoard = boardRepository.findById(board.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Board not found"));
        return mapToResponse(savedBoard);
    }

    @Transactional(readOnly = true)
    public BoardResponse getBoardById(Long boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Board not found: " + boardId));
        return mapToResponse(board);
    }

    @Transactional(readOnly = true)
    public List<BoardResponse> getBoardsByWorkspace(Long workspaceId) {
        return boardRepository.findByWorkspaceIdAndIsArchivedFalseOrderByPositionIndexAsc(workspaceId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BoardResponse> getMyBoards(Long userId) {
        return boardRepository.findByUserId(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public BoardResponse updateBoard(Long boardId, String name, String description, Boolean isStarred) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new ResourceNotFoundException("Board not found"));
        if (name != null) board.setName(name);
        if (description != null) board.setDescription(description);
        if (isStarred != null) board.setIsStarred(isStarred);
        board = boardRepository.save(board);
        return mapToResponse(board);
    }

    @Transactional
    public void deleteBoard(Long boardId) {
        if (!boardRepository.existsById(boardId)) {
            throw new ResourceNotFoundException("Board not found");
        }
        boardRepository.deleteById(boardId);
    }

    public BoardResponse mapToResponse(Board board) {
        List<BoardColumnResponse> columns = board.getColumns().stream()
                .map(col -> {
                    List<TaskResponse> tasks = col.getTasks().stream()
                            .filter(t -> !t.getIsArchived())
                            .map(taskService::mapToResponse)
                            .collect(Collectors.toList());
                    return BoardColumnResponse.builder()
                            .id(col.getId())
                            .title(col.getTitle())
                            .boardId(board.getId())
                            .positionIndex(col.getPositionIndex())
                            .color(col.getColor())
                            .wipLimit(col.getWipLimit())
                            .isDoneColumn(col.getIsDoneColumn())
                            .tasks(tasks)
                            .createdAt(col.getCreatedAt())
                            .build();
                })
                .collect(Collectors.toList());

        return BoardResponse.builder()
                .id(board.getId())
                .name(board.getName())
                .description(board.getDescription())
                .workspaceId(board.getWorkspace().getId())
                .owner(authService.mapToUserResponse(board.getOwner()))
                .backgroundColor(board.getBackgroundColor())
                .isStarred(board.getIsStarred())
                .isArchived(board.getIsArchived())
                .visibility(board.getVisibility())
                .positionIndex(board.getPositionIndex())
                .columns(columns)
                .createdAt(board.getCreatedAt())
                .updatedAt(board.getUpdatedAt())
                .build();
    }
}
