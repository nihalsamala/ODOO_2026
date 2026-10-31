package com.subscription.backend.payment;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping
    public ResponseEntity<List<PaymentDto.PaymentResponse>> getPayments(
            @RequestParam(required = false) Long invoiceId,
            @RequestParam(required = false) Long customerId) {
        return ResponseEntity.ok(paymentService.getPayments(invoiceId, customerId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentDto.PaymentResponse> getPaymentById(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.getPaymentById(id));
    }

    @PostMapping
    public ResponseEntity<PaymentDto.PaymentResponse> recordPayment(
            @Valid @RequestBody PaymentDto.PaymentRequest request) {
        PaymentDto.PaymentResponse response = paymentService.recordPayment(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
}
