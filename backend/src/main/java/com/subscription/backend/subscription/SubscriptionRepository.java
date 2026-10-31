package com.subscription.backend.subscription;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
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
}
