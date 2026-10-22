package com.titanfit.repository;

import com.titanfit.entity.FaceVector;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FaceVectorRepository extends JpaRepository<FaceVector, Long> {

    Optional<FaceVector> findByMemberId(Long memberId);

    // Lấy tất cả vector khuôn mặt đã đăng ký (face_enrolled = true)
    @Query("SELECT fv FROM FaceVector fv JOIN FETCH fv.member m WHERE m.faceEnrolled = true")
    List<FaceVector> findAllEnrolledVectors();
}
