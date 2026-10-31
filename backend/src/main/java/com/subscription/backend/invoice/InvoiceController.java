package com.subscription.backend.invoice;

import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping
    public ResponseEntity<List<InvoiceDto.InvoiceResponse>> getInvoices(
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long subscriptionId,
            @RequestParam(required = false) InvoiceStatus status) {
        return ResponseEntity.ok(invoiceService.getInvoices(customerId, subscriptionId, status));
    }

    @GetMapping("/{id}")
    public ResponseEntity<InvoiceDto.InvoiceResponse> getInvoiceById(@PathVariable Long id) {
        return ResponseEntity.ok(invoiceService.getInvoiceById(id));
    }

    @PostMapping("/generate")
    public ResponseEntity<?> generateInvoices(
            @RequestParam(required = false) Long subscriptionId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate) {
        if (subscriptionId != null) {
            InvoiceDto.InvoiceResponse single = invoiceService.generateInvoiceForSubscription(subscriptionId, asOfDate);
            return new ResponseEntity<>(single, HttpStatus.CREATED);
        } else {
            List<InvoiceDto.InvoiceResponse> generated = invoiceService.generateDueInvoices(asOfDate);
            return ResponseEntity.ok(generated);
        }
    }

    @PostMapping("/{id}/confirm")
    public ResponseEntity<InvoiceDto.InvoiceResponse> confirmInvoice(@PathVariable Long id) {
        return ResponseEntity.ok(invoiceService.confirmInvoice(id));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<InvoiceDto.InvoiceResponse> cancelInvoice(@PathVariable Long id) {
        return ResponseEntity.ok(invoiceService.cancelInvoice(id));
    }
}
