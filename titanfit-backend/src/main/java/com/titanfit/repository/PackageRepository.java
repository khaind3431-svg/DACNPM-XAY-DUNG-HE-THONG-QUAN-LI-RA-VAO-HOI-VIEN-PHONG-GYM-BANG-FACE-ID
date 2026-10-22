package com.titanfit.repository;

import com.titanfit.entity.GymPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PackageRepository extends JpaRepository<GymPackage, Long> {

    List<GymPackage> findByIsActive(Boolean isActive);

    Optional<GymPackage> findByName(String name);
}
