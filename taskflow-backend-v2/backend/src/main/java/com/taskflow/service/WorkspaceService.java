package com.taskflow.service;

import com.taskflow.dto.response.WorkspaceResponse;
import com.taskflow.entity.Workspace;
import com.taskflow.entity.User;
import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.repository.WorkspaceRepository;
import com.taskflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final UserRepository userRepository;
    private final AuthService authService;

    @Transactional(readOnly = true)
    public List<WorkspaceResponse> getUserWorkspaces(Long userId) {
        return workspaceRepository.findByOwnerId(userId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public WorkspaceResponse getWorkspaceById(Long workspaceId) {
        Workspace ws = workspaceRepository.findById(workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found"));
        return mapToResponse(ws);
    }

    @Transactional
    public WorkspaceResponse createWorkspace(Long userId, String name, String description, String color) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        String slug = name.toLowerCase().replaceAll("[^a-z0-9]", "-") + "-" + System.currentTimeMillis();
        Workspace ws = Workspace.builder()
                .name(name).description(description).slug(slug)
                .owner(owner).color(color != null ? color : "#6366f1").isPersonal(false)
                .build();
        return mapToResponse(workspaceRepository.save(ws));
    }

    @Transactional
    public WorkspaceResponse getOrCreatePersonalWorkspace(Long userId) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return workspaceRepository.findPersonalWorkspace(userId)
                .map(this::mapToResponse)
                .orElseGet(() -> {
                    String slug = owner.getUsername() + "-personal-" + System.currentTimeMillis();
                    Workspace ws = Workspace.builder()
                            .name(owner.getUsername() + "'s Workspace")
                            .slug(slug).owner(owner).color("#6366f1").isPersonal(true).build();
                    return mapToResponse(workspaceRepository.save(ws));
                });
    }

    public WorkspaceResponse mapToResponse(Workspace ws) {
        return WorkspaceResponse.builder()
                .id(ws.getId())
                .name(ws.getName())
                .description(ws.getDescription())
                .slug(ws.getSlug())
                .owner(authService.mapToUserResponse(ws.getOwner()))
                .logoUrl(ws.getLogoUrl())
                .color(ws.getColor())
                .isPersonal(ws.getIsPersonal())
                .createdAt(ws.getCreatedAt())
                .build();
    }
}
