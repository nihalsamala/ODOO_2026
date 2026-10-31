package com.subscription.backend.subscription;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @GetMapping
    public ResponseEntity<List<SubscriptionDto.SubscriptionResponse>> getSubscriptions(
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) SubscriptionStatus status) {
        return ResponseEntity.ok(subscriptionService.getSubscriptions(customerId, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SubscriptionDto.SubscriptionResponse> getSubscriptionById(@PathVariable Long id) {
        return ResponseEntity.ok(subscriptionService.getSubscriptionById(id));
    }

    @PostMapping
    public ResponseEntity<SubscriptionDto.SubscriptionResponse> createSubscription(
            @Valid @RequestBody SubscriptionDto.SubscriptionRequest request) {
        SubscriptionDto.SubscriptionResponse response = subscriptionService.createSubscription(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/{id}/confirm")
    public ResponseEntity<SubscriptionDto.SubscriptionResponse> confirmSubscription(@PathVariable Long id) {
        return ResponseEntity.ok(subscriptionService.confirmSubscription(id));
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<SubscriptionDto.SubscriptionResponse> activateSubscription(@PathVariable Long id) {
        return ResponseEntity.ok(subscriptionService.activateSubscription(id));
    }

    @PostMapping("/{id}/pause")
    public ResponseEntity<SubscriptionDto.SubscriptionResponse> pauseSubscription(@PathVariable Long id) {
        return ResponseEntity.ok(subscriptionService.pauseSubscription(id));
    }

    @PostMapping("/{id}/resume")
    public ResponseEntity<SubscriptionDto.SubscriptionResponse> resumeSubscription(@PathVariable Long id) {
        return ResponseEntity.ok(subscriptionService.resumeSubscription(id));
    }

    @PostMapping("/{id}/close")
    public ResponseEntity<SubscriptionDto.SubscriptionResponse> closeSubscription(@PathVariable Long id) {
        return ResponseEntity.ok(subscriptionService.closeSubscription(id));
    }
}
