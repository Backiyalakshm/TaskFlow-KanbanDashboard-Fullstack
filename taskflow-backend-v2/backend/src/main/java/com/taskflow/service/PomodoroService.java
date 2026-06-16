package com.taskflow.service;

import com.taskflow.dto.response.PomodoroSessionResponse;
import com.taskflow.entity.*;
import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PomodoroService {

    private final PomodoroSessionRepository pomodoroSessionRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;

    @Transactional
    public PomodoroSessionResponse startSession(Long userId, Long taskId, String mode,
                                                 Integer workDuration, Integer breakDuration) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Task task = null;
        if (taskId != null) {
            task = taskRepository.findById(taskId).orElse(null);
        }

        PomodoroSession session = PomodoroSession.builder()
                .user(user)
                .task(task)
                .mode(mode != null ? mode : "CLASSIC")
                .workDuration(workDuration != null ? workDuration : 25)
                .breakDuration(breakDuration != null ? breakDuration : 5)
                .status("IN_PROGRESS")
                .startedAt(LocalDateTime.now())
                .sessionDate(LocalDate.now())
                .interruptions(0)
                .build();

        session = pomodoroSessionRepository.save(session);
        return mapToResponse(session);
    }

    @Transactional
    public PomodoroSessionResponse completeSession(Long sessionId, Integer interruptions, String notes) {
        PomodoroSession session = pomodoroSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        session.setStatus("COMPLETED");
        session.setCompletedAt(LocalDateTime.now());
        session.setInterruptions(interruptions != null ? interruptions : 0);
        session.setNotes(notes);

        // Calculate focus score: 100 - (interruptions * 10), min 0
        double focusScore = Math.max(0, 100.0 - (session.getInterruptions() * 10));
        session.setFocusScore(focusScore);

        session = pomodoroSessionRepository.save(session);
        return mapToResponse(session);
    }

    @Transactional(readOnly = true)
    public List<PomodoroSessionResponse> getUserSessions(Long userId) {
        return pomodoroSessionRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Long getTodaySessionCount(Long userId) {
        return pomodoroSessionRepository.countCompletedSince(userId, LocalDate.now());
    }

    @Transactional(readOnly = true)
    public Long getTodayFocusMinutes(Long userId) {
        Long minutes = pomodoroSessionRepository.getTotalFocusMinutes(userId, LocalDate.now());
        return minutes != null ? minutes : 0L;
    }

    public PomodoroSessionResponse mapToResponse(PomodoroSession s) {
        return PomodoroSessionResponse.builder()
                .id(s.getId())
                .taskId(s.getTask() != null ? s.getTask().getId() : null)
                .taskTitle(s.getTask() != null ? s.getTask().getTitle() : null)
                .mode(s.getMode())
                .workDuration(s.getWorkDuration())
                .breakDuration(s.getBreakDuration())
                .status(s.getStatus())
                .startedAt(s.getStartedAt())
                .completedAt(s.getCompletedAt())
                .interruptions(s.getInterruptions())
                .focusScore(s.getFocusScore())
                .notes(s.getNotes())
                .sessionDate(s.getSessionDate())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
