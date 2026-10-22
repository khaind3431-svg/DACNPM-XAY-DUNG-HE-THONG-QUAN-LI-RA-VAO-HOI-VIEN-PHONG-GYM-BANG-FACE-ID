package com.titanfit.repository;

import com.titanfit.entity.FaceLandmarks;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FaceLandmarksRepository extends JpaRepository<FaceLandmarks, Long> {

    Optional<FaceLandmarks> findByMemberId(Long memberId);
}
