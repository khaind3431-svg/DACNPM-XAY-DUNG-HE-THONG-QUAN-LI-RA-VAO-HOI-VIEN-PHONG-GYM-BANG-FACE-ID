package com.titanfit.controller;

import com.titanfit.dto.response.PackageResponse;
import com.titanfit.entity.GymPackage;
import com.titanfit.exception.ResourceNotFoundException;
import com.titanfit.repository.MemberRepository;
import com.titanfit.repository.PackageRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Controller quản lý gói tập
 */
@RestController
@RequestMapping("/api/packages")
public class PackageController {

    private final PackageRepository packageRepository;
    private final MemberRepository memberRepository;

    public PackageController(PackageRepository packageRepository,
                              MemberRepository memberRepository) {
        this.packageRepository = packageRepository;
        this.memberRepository = memberRepository;
    }

    /** GET /api/packages — Danh sách gói tập */
    @GetMapping
    public ResponseEntity<List<PackageResponse>> getPackages() {
        List<GymPackage> packages = packageRepository.findByIsActive(true);
        List<PackageResponse> responses = packages.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    /** GET /api/packages/{id} — Chi tiết gói tập */
    @GetMapping("/{id}")
    public ResponseEntity<PackageResponse> getPackage(@PathVariable Long id) {
        GymPackage pkg = packageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gói tập", "id", id));
        return ResponseEntity.ok(toResponse(pkg));
    }

    /** POST /api/packages — Tạo gói tập mới (ADMIN only) */
    @PostMapping
    public ResponseEntity<PackageResponse> createPackage(@RequestBody GymPackage pkg) {
        pkg.setIsActive(true);
        GymPackage saved = packageRepository.save(pkg);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved));
    }

    /** PUT /api/packages/{id} — Cập nhật gói tập (ADMIN only) */
    @PutMapping("/{id}")
    public ResponseEntity<PackageResponse> updatePackage(@PathVariable Long id,
                                                          @RequestBody GymPackage updated) {
        GymPackage pkg = packageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gói tập", "id", id));

        if (updated.getName() != null) pkg.setName(updated.getName());
        if (updated.getTargetAudience() != null) pkg.setTargetAudience(updated.getTargetAudience());
        if (updated.getDurationDays() != null) pkg.setDurationDays(updated.getDurationDays());
        if (updated.getPriceVnd() != null) pkg.setPriceVnd(updated.getPriceVnd());
        if (updated.getPtSessionsIncluded() != null) pkg.setPtSessionsIncluded(updated.getPtSessionsIncluded());
        if (updated.getAccessHours() != null) pkg.setAccessHours(updated.getAccessHours());
        if (updated.getTowelLockerIncluded() != null) pkg.setTowelLockerIncluded(updated.getTowelLockerIncluded());
        if (updated.getInbodyScansPerMonth() != null) pkg.setInbodyScansPerMonth(updated.getInbodyScansPerMonth());

        GymPackage saved = packageRepository.save(pkg);
        return ResponseEntity.ok(toResponse(saved));
    }

    /** DELETE /api/packages/{id} — Vô hiệu hóa gói tập (ADMIN only) */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deletePackage(@PathVariable Long id) {
        GymPackage pkg = packageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Gói tập", "id", id));
        pkg.setIsActive(false);
        packageRepository.save(pkg);
        return ResponseEntity.ok(Map.of("message", "Đã vô hiệu hóa gói tập: " + pkg.getName()));
    }

    private PackageResponse toResponse(GymPackage pkg) {
        // Đếm số hội viên đang dùng gói này
        long subscriberCount = memberRepository.findAll().stream()
                .filter(m -> m.getGymPackage() != null && m.getGymPackage().getId().equals(pkg.getId()))
                .count();

        return PackageResponse.builder()
                .id(pkg.getId())
                .name(pkg.getName())
                .targetAudience(pkg.getTargetAudience())
                .durationDays(pkg.getDurationDays())
                .priceVnd(pkg.getPriceVnd())
                .ptSessionsIncluded(pkg.getPtSessionsIncluded())
                .accessHours(pkg.getAccessHours())
                .towelLockerIncluded(pkg.getTowelLockerIncluded())
                .inbodyScansPerMonth(pkg.getInbodyScansPerMonth())
                .isActive(pkg.getIsActive())
                .subscriberCount(subscriberCount)
                .build();
    }
}
