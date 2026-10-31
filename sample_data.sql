-- ============================================================================
-- SubscriptIQ Subscription Management System - Realistic Demo & Test Dataset
-- Database: MySQL 8.0+
-- Schema: subscription
-- Purpose: Reference dataset for Hackathon evaluation and manual verification
-- Note: Automatically seeded safely and idempotently on Spring Boot startup via TestDataSeeder.java
-- ============================================================================

USE `subscription`;

-- 1. USERS & ROLES (BCrypt hash for 'Admin@123', 'Staff@123', 'User@123')
-- Password hashes:
-- Admin@123 -> $2a$10$w099zV/pI3N1Ea0R5X5C.OBwVbWc1gWkM4K1d8E1c8kE2L0nS0V3i (encoded dynamically)
-- Staff@123 -> standard BCrypt
-- User@123  -> standard BCrypt

-- 2. CUSTOMERS
-- - Acme Cloud Corp (user@subscriptiq.com)
-- - Acro Industries (r.gupta@acroindustries.com)
-- - NovaTech Solutions (elena.vance@novatech.co)
-- - QuantumScale Labs (billing@quantumscale.io)
-- - Apex Global Logistics (finance@apexlogistics.com)
-- - Zenith Digital Media (accounts@zenithmedia.net)

-- 3. PRODUCTS & VARIANTS
-- - Cloud Storage Engine (DIGITAL, $120.00)
--   * Multi-Region Geo-Replication (+$50.00)
--   * Cold Archival Tier (-$30.00)
-- - Project Management Suite (SERVICE, $250.00)
--   * Unlimited Automations & Integrations (+$75.00)
--   * HIPAA & SOC-2 Compliance Pack (+$120.00)
-- - Enterprise Analytics Platform (DIGITAL, $400.00)
--   * AI Predictive Analytics Add-on (+$180.00)
--   * Dedicated BI Compute Node (+$250.00)
-- - Premium 24/7 SLA Support (SERVICE, $300.00)
--   * Dedicated TAM & Weekend Escalations (+$150.00)
-- - Team Collaboration & Chat Hub (DIGITAL, $150.00)
--   * Enterprise Recording & Archiving (+$60.00)
-- - Hardware Security Key Bundle (PHYSICAL, $85.00)

-- 4. PLANS
-- - Starter Monthly Plan ($0.00, MONTHLY, minQty: 1, AUTO_RENEW)
-- - Growth Monthly Plan ($50.00, MONTHLY, minQty: 1, AUTO_RENEW)
-- - Enterprise Annual Plan ($450.00, YEARLY, minQty: 5, AUTO_RENEW)
-- - Weekly Fast-Track Sprint ($25.00, WEEKLY, minQty: 1, AUTO_CLOSE)
-- - Fixed-Term Pilot Plan ($100.00, MONTHLY, minQty: 1, MANUAL_RENEWAL)

-- 5. DISCOUNT RULES
-- - WELCOME10 (10% percentage discount, target: ALL)
-- - SAVE50FIXED ($50 fixed discount on purchase >= $200.00, target: ALL)
-- - VOLUME20 (20% percentage discount for subscriptions with min qty 5, min purchase $500.00)
-- - HACKATHON2026 (15% percentage discount for year 2026)

-- 6. TAX RULES
-- - Standard VAT (10%) (Rate: 10.00%)
-- - State Sales Tax (8.25%) (Rate: 8.25%)
-- - GST Services (18%) (Rate: 18.00%)
-- - Zero-Rated Export (0%) (Rate: 0.00%)

-- 7. SUBSCRIPTIONS
-- - SUB-2026-1001 (ACTIVE, Acme Cloud Corp, Cloud Storage + Multi-Region + Growth Monthly, Qty: 2, UnitPrice: $220.00, Subtotal: $440.00)
-- - SUB-2026-1002 (CONFIRMED, Acro Industries, Project Management + Unlimited Automations + Growth Monthly, Qty: 3, UnitPrice: $375.00, Subtotal: $1,125.00)
-- - SUB-2026-1003 (ACTIVE, NovaTech Solutions, Analytics Platform + Dedicated BI Node + Enterprise Annual, Qty: 5, UnitPrice: $1,100.00, Subtotal: $5,500.00)
-- - SUB-2026-1004 (PAUSED, QuantumScale Labs, Team Collaboration + Starter Monthly, Qty: 10, UnitPrice: $150.00, Subtotal: $1,500.00, PausedAt: 2026-10-10)
-- - SUB-2026-1005 (DRAFT, Apex Global Logistics, Premium 24/7 SLA Support + Starter Monthly, Qty: 1, UnitPrice: $300.00, Subtotal: $300.00)
-- - SUB-2026-1006 (CLOSED, Zenith Digital Media, Cloud Storage + Weekly Sprint, Qty: 1, UnitPrice: $145.00, Subtotal: $145.00, Expiry: 2026-10-01)

-- 8. INVOICES
-- - INV-2026-1001 (PAID, Total: $440.00, AmountPaid: $440.00, Outstanding: $0.00)
-- - INV-2026-1002 (PARTIALLY_PAID, Total: $1,125.00, AmountPaid: $600.00, Outstanding: $525.00)
-- - INV-2026-1003 (PAID, Total: $5,500.00, AmountPaid: $5,500.00, Outstanding: $0.00)
-- - INV-2026-1004 (CONFIRMED/OVERDUE, Total: $1,500.00, AmountPaid: $0.00, Outstanding: $1,500.00, Due: 2026-09-16)
-- - INV-2026-1005 (DRAFT, Total: $440.00, AmountPaid: $0.00, Outstanding: $440.00)
-- - INV-2026-1006 (CONFIRMED, Total: $1,125.00, AmountPaid: $0.00, Outstanding: $1,125.00, Due: 2026-11-15)

-- 9. PAYMENTS
-- - PAY-2026-1001 (Invoice: INV-2026-1001, Amount: $440.00, Method: CREDIT_CARD, Date: 2026-09-05)
-- - PAY-2026-1002 (Invoice: INV-2026-1002, Amount: $600.00, Method: BANK_TRANSFER, Date: 2026-10-20)
-- - PAY-2026-1003 (Invoice: INV-2026-1003, Amount: $5,500.00, Method: BANK_TRANSFER, Date: 2026-01-05)

-- 10. VERIFIED DASHBOARD AGGREGATIONS
-- Active Subscriptions: 2 (SUB-2026-1001, SUB-2026-1003)
-- Revenue Received:     $6,540.00 ($440 + $600 + $5,500)
-- Amount Owed:          $3,150.00 ($525 + $1,500 + $1,125)
-- Overdue Invoices:     1 (INV-2026-1004)
-- Total Customers:      6
-- Total Invoices:       6
