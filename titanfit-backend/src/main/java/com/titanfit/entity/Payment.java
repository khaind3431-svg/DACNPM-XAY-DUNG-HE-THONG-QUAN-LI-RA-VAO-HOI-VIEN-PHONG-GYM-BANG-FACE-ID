package com.titanfit.entity;

import com.titanfit.enums.PaymentMethod;
import com.titanfit.enums.PaymentType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Thanh toán — ghi nhận giao dịch mua/gia hạn gói tập
 */
@Entity
@Table(name = "payments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Hội viên thực hiện thanh toán */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    /** Gói tập được thanh toán */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_id", nullable = false)
    private GymPackage gymPackage;

    /** Số tiền thanh toán (VNĐ) */
    @Column(name = "amount_vnd", nullable = false)
    private Long amountVnd;

    /** Phương thức thanh toán */
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, length = 20)
    private PaymentMethod paymentMethod;

    /** Loại thanh toán */
    @Enumerated(EnumType.STRING)
    @Column(name = "payment_type", nullable = false, length = 20)
    private PaymentType paymentType;

    /** Mã giao dịch tham chiếu */
    @Column(name = "transaction_ref", length = 100)
    private String transactionRef;

    /** Thời điểm thanh toán */
    @Column(name = "paid_at", nullable = false)
    private LocalDateTime paidAt;

    /** ID người tạo (tham chiếu User) */
    @Column(name = "created_by")
    private Long createdBy;

    /** Ghi chú */
    @Column(length = 500)
    private String note;
}
