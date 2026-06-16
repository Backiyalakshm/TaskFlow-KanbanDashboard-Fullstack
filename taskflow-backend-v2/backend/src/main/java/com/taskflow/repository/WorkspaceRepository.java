package com.taskflow.repository;

import com.taskflow.entity.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkspaceRepository extends JpaRepository<Workspace, Long> {

    List<Workspace> findByOwnerId(Long ownerId);

    Optional<Workspace> findBySlug(String slug);

    @Query("SELECT w FROM Workspace w WHERE w.owner.id = :userId AND w.isPersonal = true")
    Optional<Workspace> findPersonalWorkspace(@Param("userId") Long userId);
}
