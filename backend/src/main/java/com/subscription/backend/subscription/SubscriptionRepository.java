package com.subscription.backend.subscription;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    Optional<Subscription> findBySubscriptionNumber(String subscriptionNumber);
    boolean existsBySubscriptionNumber(String subscriptionNumber);

    List<Subscription> findByCustomerId(Long customerId);
    List<Subscription> findByCustomerIdAndStatus(Long customerId, SubscriptionStatus status);
    List<Subscription> findByStatus(SubscriptionStatus status);

    List<Subscription> findByStatusAndNextBillingDateLessThanEqual(SubscriptionStatus status, LocalDate date);

    long countByStatus(SubscriptionStatus status);

    @Query("SELECT s FROM Subscription s WHERE s.status NOT IN (:excludedStatuses) " +
           "AND ((s.nextBillingDate BETWEEN :startDate AND :endDate) " +
           "     OR (s.expiryDate IS NOT NULL AND s.expiryDate BETWEEN :startDate AND :endDate)) " +
           "ORDER BY s.nextBillingDate ASC")
    List<Subscription> findUpcomingRenewalAlerts(
            @Param("excludedStatuses") Collection<SubscriptionStatus> excludedStatuses,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("SELECT s FROM Subscription s WHERE s.customer.id = :customerId " +
           "AND s.status NOT IN (:excludedStatuses) " +
           "AND ((s.nextBillingDate BETWEEN :startDate AND :endDate) " +
           "     OR (s.expiryDate IS NOT NULL AND s.expiryDate BETWEEN :startDate AND :endDate)) " +
           "ORDER BY s.nextBillingDate ASC")
    List<Subscription> findUpcomingRenewalAlertsByCustomerId(
            @Param("customerId") Long customerId,
            @Param("excludedStatuses") Collection<SubscriptionStatus> excludedStatuses,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}
