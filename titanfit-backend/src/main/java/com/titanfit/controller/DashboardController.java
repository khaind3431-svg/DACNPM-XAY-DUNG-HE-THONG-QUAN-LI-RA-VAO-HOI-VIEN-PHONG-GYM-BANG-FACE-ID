package com.titanfit.controller;

import com.titanfit.dto.response.DashboardKpiResponse;
import com.titanfit.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller Dashboard — KPI, thống kê, biểu đồ
 */
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    /** GET /api/dashboard/kpis — Chỉ số KPI tổng quan */
    @GetMapping("/kpis")
    public ResponseEntity<DashboardKpiResponse> getKpis() {
        return ResponseEntity.ok(dashboardService.getKpis());
    }
}
