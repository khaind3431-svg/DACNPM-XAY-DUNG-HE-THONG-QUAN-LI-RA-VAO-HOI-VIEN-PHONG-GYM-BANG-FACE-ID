package com.titanfit.repository;

import com.titanfit.entity.Payment;
import com.titanfit.enums.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByMemberIdOrderByPaidAtDesc(Long memberId);

    List<Payment> findByPaymentMethodOrderByPaidAtDesc(PaymentMethod method);

    // Tổng doanh thu theo khoảng thời gian
    @Query("SELECT SUM(p.amountVnd) FROM Payment p WHERE p.paidAt BETWEEN :start AND :end")
    Long sumAmountByDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // Tổng doanh thu theo tháng trong năm
    @Query("SELECT MONTH(p.paidAt) as month, SUM(p.amountVnd) as total FROM Payment p WHERE YEAR(p.paidAt) = :year GROUP BY MONTH(p.paidAt) ORDER BY month")
    List<Object[]> sumAmountByMonth(@Param("year") int year);
}
