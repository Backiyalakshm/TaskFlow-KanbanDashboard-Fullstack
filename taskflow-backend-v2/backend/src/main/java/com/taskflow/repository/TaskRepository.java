package com.taskflow.repository;

import com.taskflow.entity.Task;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByColumnIdOrderByPositionIndexAsc(Long columnId);

    List<Task> findByBoardIdAndIsArchivedFalseOrderByPositionIndexAsc(Long boardId);

    @Query("SELECT t FROM Task t WHERE t.assignee.id = :userId AND t.isArchived = false ORDER BY t.dueDate ASC")
    List<Task> findByAssigneeId(@Param("userId") Long userId);

    @Query("SELECT t FROM Task t WHERE t.assignee.id = :userId AND t.dueDate BETWEEN :start AND :end AND t.isArchived = false")
    List<Task> findTasksDueToday(@Param("userId") Long userId,
                                  @Param("start") LocalDateTime start,
                                  @Param("end") LocalDateTime end);

    @Query("SELECT t FROM Task t WHERE t.assignee.id = :userId AND t.dueDate BETWEEN :start AND :end AND t.status != 'COMPLETED'")
    List<Task> findUpcomingTasks(@Param("userId") Long userId,
                                  @Param("start") LocalDateTime start,
                                  @Param("end") LocalDateTime end);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.assignee.id = :userId AND t.status = 'COMPLETED' AND t.completedAt >= :since")
    Long countCompletedSince(@Param("userId") Long userId, @Param("since") LocalDateTime since);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.assignee.id = :userId AND t.isArchived = false AND t.status != 'COMPLETED'")
    Long countPendingTasks(@Param("userId") Long userId);

    @Query("SELECT t FROM Task t WHERE (t.title LIKE %:query% OR t.description LIKE %:query%) AND t.board.workspace.owner.id = :userId")
    Page<Task> searchTasks(@Param("query") String query, @Param("userId") Long userId, Pageable pageable);

    List<Task> findByBoardId(Long boardId);
}
