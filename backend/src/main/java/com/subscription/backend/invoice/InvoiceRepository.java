package com.subscription.backend.invoice;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);
    boolean existsByInvoiceNumber(String invoiceNumber);

    boolean existsBySubscriptionIdAndBillingPeriod(Long subscriptionId, String billingPeriod);

    List<Invoice> findByCustomerId(Long customerId);

    List<Invoice> findByCustomerIdAndStatus(Long customerId, InvoiceStatus status);

    List<Invoice> findBySubscriptionId(Long subscriptionId);

    List<Invoice> findByStatus(InvoiceStatus status);

    long countByDueDateBeforeAndStatusNotIn(LocalDate date, Collection<InvoiceStatus> statuses);

    @Query("SELECT COALESCE(SUM(i.outstandingBalance), 0) FROM Invoice i WHERE i.status IN :statuses")
    BigDecimal sumOutstandingBalanceByStatusIn(@Param("statuses") Collection<InvoiceStatus> statuses);
}
