package com.taskflow.service;

import com.taskflow.dto.response.StudySessionResponse;
import com.taskflow.entity.*;
import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StudyService {

    private final StudySessionRepository studySessionRepository;
    private final UserRepository userRepository;

    @Transactional
    public StudySessionResponse createSession(Long userId, String subject, String topic,
                                               Double hoursStudied, Integer problemsSolved,
                                               String notes, String difficulty) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        StudySession session = StudySession.builder()
                .user(user)
                .subject(subject)
                .topic(topic)
                .hoursStudied(hoursStudied != null ? hoursStudied : 0.0)
                .problemsSolved(problemsSolved != null ? problemsSolved : 0)
                .notes(notes)
                .difficulty(difficulty != null ? difficulty : "MEDIUM")
                .sessionDate(LocalDate.now())
                .startedAt(java.time.LocalDateTime.now())
                .build();

        session = studySessionRepository.save(session);
        return mapToResponse(session);
    }

    @Transactional(readOnly = true)
    public List<StudySessionResponse> getUserSessions(Long userId) {
        return studySessionRepository.findByUserIdOrderBySessionDateDesc(userId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getSubjectStats(Long userId) {
        return studySessionRepository.getHoursPerSubject(userId)
                .stream().map(row -> {
                    Map<String, Object> m = new java.util.HashMap<>();
                    m.put("subject", row[0]);
                    m.put("hours", row[1]);
                    return m;
                }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Double getWeeklyHours(Long userId) {
        Double hours = studySessionRepository.getTotalHoursSince(userId, LocalDate.now().minusDays(7));
        return hours != null ? hours : 0.0;
    }

    @Transactional
    public void deleteSession(Long sessionId) {
        studySessionRepository.deleteById(sessionId);
    }

    public StudySessionResponse mapToResponse(StudySession s) {
        return StudySessionResponse.builder()
                .id(s.getId())
                .subject(s.getSubject())
                .topic(s.getTopic())
                .hoursStudied(s.getHoursStudied())
                .problemsSolved(s.getProblemsSolved())
                .notes(s.getNotes())
                .resources(s.getResources())
                .difficulty(s.getDifficulty())
                .sessionDate(s.getSessionDate())
                .startedAt(s.getStartedAt())
                .endedAt(s.getEndedAt())
                .createdAt(s.getCreatedAt())
                .build();
    }
}
