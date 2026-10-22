package com.titanfit.repository;

import com.titanfit.entity.Member;
import com.titanfit.enums.MemberStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {

    Optional<Member> findByMemberCode(String memberCode);

    List<Member> findByStatus(MemberStatus status);

    List<Member> findByFullNameContainingIgnoreCase(String name);

    List<Member> findByFaceEnrolled(Boolean faceEnrolled);

    List<Member> findByCurrentlyInside(Boolean currentlyInside);

    Boolean existsByMemberCode(String memberCode);

    Boolean existsByPhone(String phone);

    // Tìm kiếm hội viên theo từ khóa (tên, mã, số điện thoại)
    @Query("SELECT m FROM Member m WHERE m.fullName LIKE %:keyword% OR m.memberCode LIKE %:keyword% OR m.phone LIKE %:keyword%")
    List<Member> searchByKeyword(@Param("keyword") String keyword);

    // Đếm theo status
    Long countByStatus(MemberStatus status);

    Long countByFaceEnrolled(Boolean faceEnrolled);

    Long countByCurrentlyInside(Boolean currentlyInside);
}
