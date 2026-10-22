package com.titanfit.controller;

import com.titanfit.dto.request.GateEvaluateRequest;
import com.titanfit.dto.response.GateEvaluationResponse;
import com.titanfit.service.GateAccessService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller kiểm soát cổng ra vào — đánh giá quyền truy cập bằng khuôn mặt
 */
@RestController
@RequestMapping("/api/gate")
public class GateController {

    private final GateAccessService gateAccessService;

    public GateController(GateAccessService gateAccessService) {
        this.gateAccessService = gateAccessService;
    }

    /**
     * POST /api/gate/evaluate — Đánh giá quyền ra/vào
     * Frontend gửi vector 16-D + liveness score → backend trả granted/denied
     */
    @PostMapping("/evaluate")
    public ResponseEntity<GateEvaluationResponse> evaluate(
            @Valid @RequestBody GateEvaluateRequest request) {
        GateEvaluationResponse result = gateAccessService.evaluate(request);
        return ResponseEntity.ok(result);
    }
}
