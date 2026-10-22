package com.titanfit.repository;

import com.titanfit.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByInvoiceCode(String invoiceCode);

    List<Invoice> findByMemberIdOrderByIssuedAtDesc(Long memberId);

    Boolean existsByInvoiceCode(String invoiceCode);
}
