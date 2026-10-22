package com.titanfit.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Hóa đơn — phát hành sau khi thanh toán thành công
 */
@Entity
@Table(name = "invoices")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Mã hóa đơn — định dạng "INV-2026-XXXX" */
    @Column(name = "invoice_code", unique = true, nullable = false, length = 20)
    private String invoiceCode;

    /** Giao dịch thanh toán liên kết */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id")
    private Payment payment;

    /** Hội viên liên quan */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    /** Tổng tiền trước thuế (VNĐ) */
    @Column(name = "total_amount", nullable = false)
    private Long totalAmount;

    /** Phần trăm VAT */
    @Column(name = "vat_percent")
    @Builder.Default
    private Integer vatPercent = 10;

    /** Số tiền VAT (VNĐ) */
    @Column(name = "vat_amount")
    private Long vatAmount;

    /** Tổng cộng sau thuế (VNĐ) */
    @Column(name = "grand_total", nullable = false)
    private Long grandTotal;

    /** Thời điểm phát hành hóa đơn */
    @Column(name = "issued_at", nullable = false)
    private LocalDateTime issuedAt;

    /** URL file PDF hóa đơn */
    @Column(name = "pdf_url", length = 500)
    private String pdfUrl;
}
