package com.titanfit.controller;

import com.titanfit.dto.response.AccessLogResponse;
import com.titanfit.entity.AccessLog;
import com.titanfit.enums.AccessResult;
import com.titanfit.repository.AccessLogRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Controller nhật ký ra vào — truy vấn, tìm kiếm, lọc
 */
@RestController
@RequestMapping("/api/access-logs")
public class AccessLogController {

    private final AccessLogRepository accessLogRepository;
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("HH:mm:ss dd/MM/yyyy");

    public AccessLogController(AccessLogRepository accessLogRepository) {
        this.accessLogRepository = accessLogRepository;
    }

    /** GET /api/access-logs — Danh sách log (search, filter) */
    @GetMapping
    public ResponseEntity<List<AccessLogResponse>> getLogs(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String result,
            @RequestParam(required = false) String gateId) {

        List<AccessLog> logs;
        if (search != null && !search.isBlank()) {
            logs = accessLogRepository.searchByKeyword(search);
        } else if (result != null && !result.isBlank()) {
            if ("denied".equalsIgnoreCase(result)) {
                // Lấy tất cả log denied (bất kỳ loại nào)
                logs = accessLogRepository.findAllByOrderByTimestampDesc().stream()
                        .filter(l -> l.getResult() != AccessResult.GRANTED)
                        .collect(Collectors.toList());
            } else {
                logs = accessLogRepository.findByResultOrderByTimestampDesc(
                        AccessResult.valueOf(result.toUpperCase()));
            }
        } else if (gateId != null && !gateId.isBlank()) {
            logs = accessLogRepository.findByGateIdOrderByTimestampDesc(gateId);
        } else {
            logs = accessLogRepository.findAllByOrderByTimestampDesc();
        }

        List<AccessLogResponse> responses = logs.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());

        return ResponseEntity.ok(responses);
    }

    private AccessLogResponse toResponse(AccessLog log) {
        return AccessLogResponse.builder()
                .id(log.getId())
                .timestamp(log.getTimestamp() != null ? log.getTimestamp().format(DATETIME_FMT) : null)
                .gateId(log.getGateId())
                .direction(log.getDirection() != null ? log.getDirection().name() : null)
                .memberId(log.getMember() != null ? log.getMember().getId() : null)
                .memberCode(log.getMemberCode())
                .memberName(log.getMemberName())
                .packageName(log.getPackageName())
                .similarityScore(log.getSimilarityScore())
                .livenessScore(log.getLivenessScore())
                .result(log.getResult() != null ? log.getResult().name() : null)
                .reasonVi(log.getReasonVi())
                .processingMs(log.getProcessingMs())
                .build();
    }
}
