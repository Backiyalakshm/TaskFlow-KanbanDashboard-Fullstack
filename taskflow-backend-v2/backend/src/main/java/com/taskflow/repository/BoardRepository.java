package com.taskflow.repository;

import com.taskflow.entity.Board;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BoardRepository extends JpaRepository<Board, Long> {
    List<Board> findByWorkspaceIdAndIsArchivedFalseOrderByPositionIndexAsc(Long workspaceId);

    @Query("SELECT b FROM Board b WHERE b.workspace.owner.id = :userId AND b.isArchived = false")
    List<Board> findByUserId(Long userId);

    List<Board> findByWorkspaceIdAndIsStarredTrueAndIsArchivedFalse(Long workspaceId);
}
