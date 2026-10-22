package com.titanfit.controller;

import com.titanfit.dto.request.CreateMemberRequest;
import com.titanfit.dto.request.FaceEnrollRequest;
import com.titanfit.dto.request.RenewMemberRequest;
import com.titanfit.dto.request.UpdateMemberRequest;
import com.titanfit.dto.response.MemberResponse;
import com.titanfit.service.MemberService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller quản lý hội viên — CRUD, khuôn mặt, gia hạn, đóng băng
 */
@RestController
@RequestMapping("/api/members")
public class MemberController {

    private final MemberService memberService;

    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }

    /** GET /api/members — Danh sách hội viên (có search, filter) */
    @GetMapping
    public ResponseEntity<List<MemberResponse>> getMembers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean unenrolled) {

        List<MemberResponse> members;
        if (search != null && !search.isBlank()) {
            members = memberService.searchMembers(search);
        } else if (status != null && !status.isBlank()) {
            members = memberService.getMembersByStatus(status);
        } else if (Boolean.TRUE.equals(unenrolled)) {
            members = memberService.getUnenrolledMembers();
        } else {
            members = memberService.getAllMembers();
        }
        return ResponseEntity.ok(members);
    }

    /** GET /api/members/{id} — Chi tiết hội viên */
    @GetMapping("/{id}")
    public ResponseEntity<MemberResponse> getMember(@PathVariable Long id) {
        return ResponseEntity.ok(memberService.getMemberById(id));
    }

    /** POST /api/members — Tạo hội viên mới */
    @PostMapping
    public ResponseEntity<MemberResponse> createMember(@Valid @RequestBody CreateMemberRequest request) {
        MemberResponse created = memberService.createMember(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /** PUT /api/members/{id} — Cập nhật thông tin */
    @PutMapping("/{id}")
    public ResponseEntity<MemberResponse> updateMember(@PathVariable Long id,
                                                        @Valid @RequestBody UpdateMemberRequest request) {
        return ResponseEntity.ok(memberService.updateMember(id, request));
    }

    /** POST /api/members/{id}/face/enroll — Đăng ký khuôn mặt */
    @PostMapping("/{id}/face/enroll")
    public ResponseEntity<MemberResponse> enrollFace(@PathVariable Long id,
                                                      @Valid @RequestBody FaceEnrollRequest request) {
        return ResponseEntity.ok(memberService.enrollFace(id, request));
    }

    /** PUT /api/members/{id}/face/re-enroll — Cập nhật khuôn mặt */
    @PutMapping("/{id}/face/re-enroll")
    public ResponseEntity<MemberResponse> reEnrollFace(@PathVariable Long id,
                                                        @Valid @RequestBody FaceEnrollRequest request) {
        return ResponseEntity.ok(memberService.enrollFace(id, request));
    }

    /** DELETE /api/members/{id}/face — Xóa dữ liệu khuôn mặt */
    @DeleteMapping("/{id}/face")
    public ResponseEntity<MemberResponse> deleteFace(@PathVariable Long id) {
        return ResponseEntity.ok(memberService.deleteFace(id));
    }

    /** POST /api/members/{id}/renew — Gia hạn gói tập */
    @PostMapping("/{id}/renew")
    public ResponseEntity<MemberResponse> renewPackage(@PathVariable Long id,
                                                        @Valid @RequestBody RenewMemberRequest request) {
        return ResponseEntity.ok(memberService.renewPackage(id, request));
    }

    /** PATCH /api/members/{id}/freeze — Đóng băng / mở đóng băng */
    @PatchMapping("/{id}/freeze")
    public ResponseEntity<MemberResponse> toggleFreeze(@PathVariable Long id) {
        return ResponseEntity.ok(memberService.toggleFreeze(id));
    }

    /** DELETE /api/members/{id} — Xóa hội viên */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteMember(@PathVariable Long id) {
        memberService.deleteMember(id);
        return ResponseEntity.ok(Map.of("message", "Đã xóa hội viên thành công"));
    }
}
