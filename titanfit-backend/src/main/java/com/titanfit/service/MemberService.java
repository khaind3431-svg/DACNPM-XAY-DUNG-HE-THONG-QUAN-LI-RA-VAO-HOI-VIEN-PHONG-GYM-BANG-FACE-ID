package com.titanfit.service;

import com.titanfit.dto.request.CreateMemberRequest;
import com.titanfit.dto.request.FaceEnrollRequest;
import com.titanfit.dto.request.RenewMemberRequest;
import com.titanfit.dto.request.UpdateMemberRequest;
import com.titanfit.dto.response.MemberResponse;
import com.titanfit.entity.FaceLandmarks;
import com.titanfit.entity.FaceVector;
import com.titanfit.entity.GymPackage;
import com.titanfit.entity.Member;
import com.titanfit.enums.BiometricModality;
import com.titanfit.enums.Gender;
import com.titanfit.enums.MemberStatus;
import com.titanfit.exception.BusinessLogicException;
import com.titanfit.exception.ResourceNotFoundException;
import com.titanfit.repository.FaceLandmarksRepository;
import com.titanfit.repository.FaceVectorRepository;
import com.titanfit.repository.MemberRepository;
import com.titanfit.repository.PackageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service quản lý hội viên — CRUD, gia hạn, đóng băng, đăng ký khuôn mặt
 */
@Service
public class MemberService {

    private final MemberRepository memberRepository;
    private final PackageRepository packageRepository;
    private final FaceVectorRepository faceVectorRepository;
    private final FaceLandmarksRepository faceLandmarksRepository;
    private final BiometricService biometricService;
    private final GateAccessService gateAccessService;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATETIME_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    public MemberService(MemberRepository memberRepository,
                          PackageRepository packageRepository,
                          FaceVectorRepository faceVectorRepository,
                          FaceLandmarksRepository faceLandmarksRepository,
                          BiometricService biometricService,
                          GateAccessService gateAccessService) {
        this.memberRepository = memberRepository;
        this.packageRepository = packageRepository;
        this.faceVectorRepository = faceVectorRepository;
        this.faceLandmarksRepository = faceLandmarksRepository;
        this.biometricService = biometricService;
        this.gateAccessService = gateAccessService;
    }

    /**
     * Lấy tất cả hội viên
     */
    public List<MemberResponse> getAllMembers() {
        return memberRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Tìm kiếm hội viên theo từ khóa
     */
    public List<MemberResponse> searchMembers(String keyword) {
        return memberRepository.searchByKeyword(keyword).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy hội viên theo trạng thái
     */
    public List<MemberResponse> getMembersByStatus(String status) {
        MemberStatus memberStatus = MemberStatus.valueOf(status.toUpperCase());
        return memberRepository.findByStatus(memberStatus).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy hội viên chưa đăng ký khuôn mặt
     */
    public List<MemberResponse> getUnenrolledMembers() {
        return memberRepository.findByFaceEnrolled(false).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy chi tiết hội viên theo ID
     */
    public MemberResponse getMemberById(Long id) {
        Member member = findMemberOrThrow(id);
        return toResponse(member);
    }

    /**
     * Tạo hội viên mới
     */
    @Transactional
    public MemberResponse createMember(CreateMemberRequest request) {
        // Kiểm tra SĐT trùng
        if (memberRepository.existsByPhone(request.getPhone())) {
            throw new BusinessLogicException("Số điện thoại '" + request.getPhone() + "' đã được đăng ký");
        }

        GymPackage pkg = packageRepository.findById(request.getPackageId())
                .orElseThrow(() -> new ResourceNotFoundException("Gói tập", "id", request.getPackageId()));

        Gender gender = Gender.valueOf(request.getGender().toUpperCase());

        // Tạo mã hội viên
        long count = memberRepository.count();
        String memberCode = "TF-2026-" + (1025 + count);

        LocalDate startDate = LocalDate.now();
        LocalDate endDate = startDate.plusDays(pkg.getDurationDays());

        Member member = Member.builder()
                .memberCode(memberCode)
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .gender(gender)
                .gymPackage(pkg)
                .startDate(startDate)
                .endDate(endDate)
                .status(MemberStatus.ACTIVE)
                .ptSessionsRemaining(pkg.getPtSessionsIncluded())
                .assignedTrainer(request.getAssignedTrainer())
                .build();

        // Đăng ký khuôn mặt ngay nếu có
        if (request.isEnrollFaceNow() && request.getFaceVector() != null && request.getFaceVector().length == 16) {
            member.setFaceEnrolled(true);
            member.setFaceModality(request.getFaceModality() != null
                    ? BiometricModality.valueOf(request.getFaceModality())
                    : BiometricModality.THREE_D_TEMPLATE);
            member.setFaceQualityScore(98.0);
            member.setFaceEnrolledAt(LocalDateTime.now());
            member.setEnrolledPhotoUrl(request.getEnrolledPhotoUrl());
        }

        Member saved = memberRepository.save(member);

        // Lưu face vector
        if (request.isEnrollFaceNow() && request.getFaceVector() != null) {
            saveFaceVector(saved, request.getFaceVector());
        }

        // Tạo face landmarks mặc định
        saveFaceLandmarks(saved, gender);

        return toResponse(saved);
    }

    /**
     * Cập nhật thông tin hội viên
     */
    @Transactional
    public MemberResponse updateMember(Long id, UpdateMemberRequest request) {
        Member member = findMemberOrThrow(id);

        if (request.getFullName() != null) member.setFullName(request.getFullName());
        if (request.getPhone() != null) member.setPhone(request.getPhone());
        if (request.getEmail() != null) member.setEmail(request.getEmail());
        if (request.getAssignedTrainer() != null) member.setAssignedTrainer(request.getAssignedTrainer());
        if (request.getLockerNumber() != null) member.setLockerNumber(request.getLockerNumber());

        Member saved = memberRepository.save(member);
        return toResponse(saved);
    }

    /**
     * Đăng ký / cập nhật khuôn mặt cho hội viên
     */
    @Transactional
    public MemberResponse enrollFace(Long memberId, FaceEnrollRequest request) {
        Member member = findMemberOrThrow(memberId);

        if (request.getFaceVector() == null || request.getFaceVector().length != 16) {
            throw new BusinessLogicException("Vector khuôn mặt phải có đúng 16 chiều");
        }

        member.setFaceEnrolled(true);
        member.setFaceModality(request.getModality() != null
                ? BiometricModality.valueOf(request.getModality())
                : BiometricModality.THREE_D_TEMPLATE);
        member.setFaceQualityScore(request.getQualityScore());
        member.setFaceEnrolledAt(LocalDateTime.now());
        if (request.getPhotoDataUrl() != null) {
            member.setEnrolledPhotoUrl(request.getPhotoDataUrl());
        }

        memberRepository.save(member);

        // Cập nhật hoặc tạo mới face vector
        saveFaceVector(member, request.getFaceVector());

        return toResponse(member);
    }

    /**
     * Xóa dữ liệu khuôn mặt
     */
    @Transactional
    public MemberResponse deleteFace(Long memberId) {
        Member member = findMemberOrThrow(memberId);

        member.setFaceEnrolled(false);
        member.setFaceModality(null);
        member.setFaceQualityScore(0.0);
        member.setFaceEnrolledAt(null);
        member.setEnrolledPhotoUrl(null);

        faceVectorRepository.findByMemberId(memberId)
                .ifPresent(faceVectorRepository::delete);

        memberRepository.save(member);
        return toResponse(member);
    }

    /**
     * Gia hạn gói tập
     */
    @Transactional
    public MemberResponse renewPackage(Long memberId, RenewMemberRequest request) {
        Member member = findMemberOrThrow(memberId);
        GymPackage pkg = packageRepository.findById(request.getPackageId())
                .orElseThrow(() -> new ResourceNotFoundException("Gói tập", "id", request.getPackageId()));

        // Gia hạn từ ngày max(hôm nay, ngày hết hạn hiện tại)
        LocalDate today = LocalDate.now();
        LocalDate baseDate = member.getEndDate().isAfter(today) ? member.getEndDate() : today;
        LocalDate newEndDate = baseDate.plusDays(pkg.getDurationDays());

        member.setGymPackage(pkg);
        member.setEndDate(newEndDate);
        member.setStatus(MemberStatus.ACTIVE);
        member.setPtSessionsRemaining(member.getPtSessionsRemaining() + pkg.getPtSessionsIncluded());

        Member saved = memberRepository.save(member);
        return toResponse(saved);
    }

    /**
     * Đóng băng / mở đóng băng
     */
    @Transactional
    public MemberResponse toggleFreeze(Long memberId) {
        Member member = findMemberOrThrow(memberId);

        boolean willFreeze = member.getStatus() != MemberStatus.FROZEN;
        MemberStatus newStatus = gateAccessService.computeMemberStatus(
                member.getEndDate(), willFreeze, LocalDate.now());

        member.setStatus(newStatus);
        Member saved = memberRepository.save(member);
        return toResponse(saved);
    }

    /**
     * Xóa hội viên (soft delete — chuyển status EXPIRED)
     */
    @Transactional
    public void deleteMember(Long id) {
        Member member = findMemberOrThrow(id);
        // Soft delete: xóa face vector và đánh dấu expired
        faceVectorRepository.findByMemberId(id).ifPresent(faceVectorRepository::delete);
        faceLandmarksRepository.findByMemberId(id).ifPresent(faceLandmarksRepository::delete);
        memberRepository.delete(member);
    }

    // ===================== HELPER METHODS =====================

    private Member findMemberOrThrow(Long id) {
        return memberRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hội viên", "id", id));
    }

    private void saveFaceVector(Member member, double[] vector) {
        FaceVector fv = faceVectorRepository.findByMemberId(member.getId())
                .orElse(FaceVector.builder().member(member).build());
        biometricService.arrayToEntity(vector, fv);
        fv.setEnrolledAt(LocalDateTime.now());
        faceVectorRepository.save(fv);
    }

    private void saveFaceLandmarks(Member member, Gender gender) {
        boolean isFemale = gender == Gender.NU;
        FaceLandmarks landmarks = FaceLandmarks.builder()
                .member(member)
                .eyeDistanceRatio(isFemale ? 0.40 : 0.43)
                .noseBridgeLength(isFemale ? 0.33 : 0.37)
                .jawWidthRatio(isFemale ? 0.72 : 0.81)
                .browArchHeight(isFemale ? 0.34 : 0.28)
                .mouthWidthRatio(isFemale ? 0.43 : 0.46)
                .faceAspect(1.26)
                .skinToneIndex((int) (memberRepository.count() % 3))
                .hairStyle(isFemale ? "bun_athletic" : "short_fade")
                .gender(gender)
                .build();
        faceLandmarksRepository.save(landmarks);
    }

    /**
     * Convert Member entity → MemberResponse DTO
     */
    private MemberResponse toResponse(Member m) {
        LocalDate today = LocalDate.now();
        int daysRemaining = (int) ChronoUnit.DAYS.between(today, m.getEndDate());

        // Load face vector nếu có
        double[] faceVectorArr = null;
        if (m.getFaceEnrolled() != null && m.getFaceEnrolled()) {
            faceVectorArr = faceVectorRepository.findByMemberId(m.getId())
                    .map(biometricService::entityToArray)
                    .orElse(null);
        }

        // Load face landmarks
        MemberResponse.FaceLandmarksDto landmarksDto = faceLandmarksRepository.findByMemberId(m.getId())
                .map(fl -> MemberResponse.FaceLandmarksDto.builder()
                        .eyeDistanceRatio(fl.getEyeDistanceRatio())
                        .noseBridgeLength(fl.getNoseBridgeLength())
                        .jawWidthRatio(fl.getJawWidthRatio())
                        .browArchHeight(fl.getBrowArchHeight())
                        .mouthWidthRatio(fl.getMouthWidthRatio())
                        .faceAspect(fl.getFaceAspect())
                        .skinToneIndex(fl.getSkinToneIndex())
                        .hairStyle(fl.getHairStyle())
                        .gender(fl.getGender() != null ? fl.getGender().name() : null)
                        .build())
                .orElse(null);

        return MemberResponse.builder()
                .id(m.getId())
                .memberCode(m.getMemberCode())
                .fullName(m.getFullName())
                .phone(m.getPhone())
                .email(m.getEmail())
                .gender(m.getGender() != null ? m.getGender().name() : null)
                .packageId(m.getGymPackage() != null ? m.getGymPackage().getId() : null)
                .packageName(m.getGymPackage() != null ? m.getGymPackage().getName() : null)
                .startDate(m.getStartDate() != null ? m.getStartDate().format(DATE_FMT) : null)
                .endDate(m.getEndDate() != null ? m.getEndDate().format(DATE_FMT) : null)
                .status(m.getStatus() != null ? m.getStatus().name() : null)
                .daysRemaining(daysRemaining)
                .faceEnrolled(m.getFaceEnrolled())
                .faceModality(m.getFaceModality() != null ? m.getFaceModality().name() : null)
                .enrolledPhotoUrl(m.getEnrolledPhotoUrl())
                .faceEnrolledAt(m.getFaceEnrolledAt() != null ? m.getFaceEnrolledAt().format(DATETIME_FMT) : null)
                .faceQualityScore(m.getFaceQualityScore())
                .faceVector(faceVectorArr)
                .ptSessionsRemaining(m.getPtSessionsRemaining())
                .totalCheckIns(m.getTotalCheckIns())
                .lastCheckIn(m.getLastCheckIn() != null ? m.getLastCheckIn().format(DATETIME_FMT) : null)
                .lockerNumber(m.getLockerNumber())
                .assignedTrainer(m.getAssignedTrainer())
                .currentlyInside(m.getCurrentlyInside())
                .landmarks(landmarksDto)
                .build();
    }
}
