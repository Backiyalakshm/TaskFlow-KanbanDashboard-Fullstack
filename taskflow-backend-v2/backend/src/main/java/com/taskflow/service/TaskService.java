package com.taskflow.service;

import com.taskflow.dto.request.TaskRequest;
import com.taskflow.dto.response.*;
import com.taskflow.entity.*;
import com.taskflow.exception.BadRequestException;
import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final BoardRepository boardRepository;
    private final BoardColumnRepository boardColumnRepository;
    private final UserRepository userRepository;
    private final AuthService authService;

    @Transactional
    public TaskResponse createTask(TaskRequest request, Long userId) {
        Board board = boardRepository.findById(request.getBoardId())
                .orElseThrow(() -> new ResourceNotFoundException("Board not found"));
        BoardColumn column = boardColumnRepository.findById(request.getColumnId())
                .orElseThrow(() -> new ResourceNotFoundException("Column not found"));
        User reporter = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        User assignee = null;
        if (request.getAssigneeId() != null) {
            assignee = userRepository.findById(request.getAssigneeId()).orElse(reporter);
        }

        Task task = Task.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .board(board)
                .column(column)
                .reporter(reporter)
                .assignee(assignee != null ? assignee : reporter)
                .priority(request.getPriority() != null ? request.getPriority() : Task.Priority.MEDIUM)
                .status(Task.TaskStatus.TODO)
                .dueDate(request.getDueDate())
                .startDate(request.getStartDate())
                .estimatedHours(request.getEstimatedHours() != null ? request.getEstimatedHours() : 0.0)
                .storyPoints(request.getStoryPoints())
                .isRecurring(request.getIsRecurring() != null ? request.getIsRecurring() : false)
                .recurrenceRule(request.getRecurrenceRule())
                .isArchived(false)
                .positionIndex(column.getTasks().size())
                .build();

        // AI Priority suggestion
        task.setAiPriority(calculateAiPriority(task));
        task.setAiSuggestion(generateAiSuggestion(task));

        task = taskRepository.save(task);
        log.info("Task created: {} by user {}", task.getId(), userId);
        return mapToResponse(task);
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByBoard(Long boardId) {
        return taskRepository.findByBoardIdAndIsArchivedFalseOrderByPositionIndexAsc(boardId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public TaskResponse getTaskById(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + taskId));
        return mapToResponse(task);
    }

    @Transactional
    public TaskResponse updateTask(Long taskId, TaskRequest request, Long userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + taskId));

        if (request.getTitle() != null) task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getPriority() != null) task.setPriority(request.getPriority());
        if (request.getDueDate() != null) task.setDueDate(request.getDueDate());
        if (request.getEstimatedHours() != null) task.setEstimatedHours(request.getEstimatedHours());
        if (request.getStoryPoints() != null) task.setStoryPoints(request.getStoryPoints());

        if (request.getColumnId() != null && !request.getColumnId().equals(task.getColumn().getId())) {
            BoardColumn newColumn = boardColumnRepository.findById(request.getColumnId())
                    .orElseThrow(() -> new ResourceNotFoundException("Column not found"));
            task.setColumn(newColumn);
            if (newColumn.getIsDoneColumn()) {
                task.setStatus(Task.TaskStatus.COMPLETED);
                task.setCompletedAt(LocalDateTime.now());
            }
        }

        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(request.getAssigneeId()).orElse(null);
            task.setAssignee(assignee);
        }

        task.setAiPriority(calculateAiPriority(task));
        task = taskRepository.save(task);
        return mapToResponse(task);
    }

    @Transactional
    public void moveTask(Long taskId, Long newColumnId, Integer newPosition) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + taskId));
        BoardColumn newColumn = boardColumnRepository.findById(newColumnId)
                .orElseThrow(() -> new ResourceNotFoundException("Column not found"));

        task.setColumn(newColumn);
        task.setPositionIndex(newPosition);

        if (newColumn.getIsDoneColumn()) {
            task.setStatus(Task.TaskStatus.COMPLETED);
            task.setCompletedAt(LocalDateTime.now());
        } else {
            task.setCompletedAt(null);
        }

        taskRepository.save(task);
    }

    @Transactional
    public void deleteTask(Long taskId) {
        if (!taskRepository.existsById(taskId)) {
            throw new ResourceNotFoundException("Task not found: " + taskId);
        }
        taskRepository.deleteById(taskId);
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getMyTasks(Long userId) {
        return taskRepository.findByAssigneeId(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksDueToday(Long userId) {
        LocalDateTime startOfDay = LocalDateTime.now().truncatedTo(ChronoUnit.DAYS);
        LocalDateTime endOfDay = startOfDay.plusDays(1).minusSeconds(1);
        return taskRepository.findTasksDueToday(userId, startOfDay, endOfDay)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PageResponse<TaskResponse> searchTasks(String query, Long userId, Pageable pageable) {
        Page<Task> page = taskRepository.searchTasks(query, userId, pageable);
        Page<TaskResponse> responsePage = page.map(this::mapToResponse);
        return PageResponse.from(responsePage);
    }

    private String calculateAiPriority(Task task) {
        int score = 0;
        if (task.getDueDate() != null) {
            long hoursUntilDue = ChronoUnit.HOURS.between(LocalDateTime.now(), task.getDueDate());
            if (hoursUntilDue < 24) score += 40;
            else if (hoursUntilDue < 72) score += 20;
            else if (hoursUntilDue < 168) score += 10;
        }
        if (task.getPriority() == Task.Priority.URGENT) score += 40;
        else if (task.getPriority() == Task.Priority.HIGH) score += 25;
        else if (task.getPriority() == Task.Priority.MEDIUM) score += 10;

        if (task.getEstimatedHours() != null && task.getEstimatedHours() > 4) score += 15;

        if (score >= 60) return "🔥 URGENT";
        else if (score >= 30) return "⚠ MEDIUM";
        else return "🟢 CAN_WAIT";
    }

    private String generateAiSuggestion(Task task) {
        if (task.getDueDate() == null) return "Consider adding a due date to better prioritize this task.";
        long hoursUntilDue = ChronoUnit.HOURS.between(LocalDateTime.now(), task.getDueDate());
        if (hoursUntilDue < 24) return "🚨 Due very soon! Focus on this task immediately.";
        else if (hoursUntilDue < 72) return "⚡ Due in " + (hoursUntilDue / 24) + " day(s). Plan dedicated time blocks.";
        else return "📅 You have " + (hoursUntilDue / 24) + " days. Break into smaller sub-tasks.";
    }

    public TaskResponse mapToResponse(Task task) {
        List<CommentResponse> comments = task.getComments().stream()
                .map(c -> CommentResponse.builder()
                        .id(c.getId())
                        .taskId(task.getId())
                        .author(authService.mapToUserResponse(c.getAuthor()))
                        .content(c.getContent())
                        .isEdited(c.getIsEdited())
                        .createdAt(c.getCreatedAt())
                        .updatedAt(c.getUpdatedAt())
                        .build())
                .collect(Collectors.toList());

        List<ChecklistResponse> checklists = task.getChecklists().stream()
                .map(cl -> ChecklistResponse.builder()
                        .id(cl.getId())
                        .title(cl.getTitle())
                        .isCompleted(cl.getIsCompleted())
                        .positionIndex(cl.getPositionIndex())
                        .build())
                .collect(Collectors.toList());

        List<LabelResponse> labels = task.getLabels().stream()
                .map(l -> LabelResponse.builder()
                        .id(l.getId())
                        .name(l.getName())
                        .color(l.getColor())
                        .build())
                .collect(Collectors.toList());

        List<TaskResponse> subTasks = task.getSubTasks().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return TaskResponse.builder()
                .id(task.getId())
                .title(task.getTitle())
                .description(task.getDescription())
                .boardId(task.getBoard().getId())
                .columnId(task.getColumn().getId())
                .parentTaskId(task.getParentTask() != null ? task.getParentTask().getId() : null)
                .assignee(task.getAssignee() != null ? authService.mapToUserResponse(task.getAssignee()) : null)
                .reporter(task.getReporter() != null ? authService.mapToUserResponse(task.getReporter()) : null)
                .priority(task.getPriority())
                .status(task.getStatus())
                .aiPriority(task.getAiPriority())
                .aiSuggestion(task.getAiSuggestion())
                .dueDate(task.getDueDate())
                .startDate(task.getStartDate())
                .estimatedHours(task.getEstimatedHours())
                .actualHours(task.getActualHours())
                .positionIndex(task.getPositionIndex())
                .isRecurring(task.getIsRecurring())
                .storyPoints(task.getStoryPoints())
                .isArchived(task.getIsArchived())
                .completedAt(task.getCompletedAt())
                .labels(labels)
                .checklists(checklists)
                .comments(comments)
                .subTasks(subTasks)
                .commentCount(task.getComments().size())
                .attachmentCount(task.getAttachments().size())
                .createdAt(task.getCreatedAt())
                .updatedAt(task.getUpdatedAt())
                .build();
    }
}
