package com.titanfit.repository;

import com.titanfit.entity.AccessLog;
import com.titanfit.enums.AccessResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AccessLogRepository extends JpaRepository<AccessLog, Long> {

    List<AccessLog> findByResultOrderByTimestampDesc(AccessResult result);

    List<AccessLog> findByGateIdOrderByTimestampDesc(String gateId);

    List<AccessLog> findAllByOrderByTimestampDesc();

    // Tìm kiếm log theo từ khóa (tên hoặc mã hội viên)
    @Query("SELECT a FROM AccessLog a WHERE a.memberName LIKE %:keyword% OR a.memberCode LIKE %:keyword%")
    List<AccessLog> searchByKeyword(@Param("keyword") String keyword);

    // Đếm theo result
    Long countByResult(AccessResult result);

    // Thống kê theo ngày
    @Query("SELECT DATE(a.timestamp) as logDate, COUNT(a) as total FROM AccessLog a WHERE a.timestamp BETWEEN :start AND :end GROUP BY DATE(a.timestamp) ORDER BY logDate")
    List<Object[]> countByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
