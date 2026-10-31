# SubscriptIQ — Subscription Management System Backend

SubscriptIQ is a production-grade, modular monolith Spring Boot REST API for comprehensive subscription management, billing cycles, invoice generation, payment reconciliation, and dashboard analytics.

---

## Technology Stack
- **Language**: Java 21+
- **Framework**: Spring Boot 4.1.2
- **Persistence**: Spring Data JPA / Hibernate 7
- **Database**: MySQL 8.0+
- **Security**: Spring Security with JWT & BCrypt Password Encoding
- **Validation**: Jakarta Bean Validation
- **Testing**: JUnit 5, Mockito

---

## Getting Started

### 1. Database Configuration
The MySQL configuration in `src/main/resources/application.properties` connects to:
- **URL**: `jdbc:mysql://localhost:3306/subscription`
- **Username**: `root`
- **Password**: Preserved as configured in the project

Ensure the database schema exists:
```sql
CREATE DATABASE IF NOT EXISTS subscription;
```

### 2. Building & Running the Backend
Use the included Maven wrapper:

```bash
# On Windows (PowerShell / Command Prompt)
.\mvnw.cmd clean package -DskipTests
.\mvnw.cmd spring-boot:run
```

The application starts on port `8080`:
- Base API URL: `http://localhost:8080/api`

### 3. Running Automated Tests
To run the automated test suite:
```bash
.\mvnw.cmd test
```
All 24 test cases across authentication, products, plans, compatibility, subscriptions, invoicing, payments, and dashboard metrics pass cleanly.

---

## Seeded Default Credentials
On initial startup, an administrator account is automatically initialized if not already present:
- **Email**: `admin@subscriptiq.com`
- **Password**: `Admin@123`
- **Role**: `ADMIN`

---

## Key Modules & Workflows

1. **Authentication & Roles**:
   - `ADMIN`: Full access; can create staff accounts (`POST /api/auth/create-staff`) and manage system taxes and discounts.
   - `STAFF`: Manages operational records (products, plans, product-plan compatibility, subscriptions, invoice generation).
   - `CUSTOMER`: Self-service registration (`POST /api/auth/register`), isolated view of their own subscriptions, invoices, and payments.

2. **Products & Variants**:
   - Create and update products with sales price, cost price, and active status.
   - Define product variants that add custom price adjustments to the base product.

3. **Plans & Compatibility**:
   - Independent plans with billing intervals (`DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`), minimum quantities, and lifecycle rules (`AUTO_CLOSE`, `AUTO_RENEW`, `MANUAL_RENEWAL`).
   - Admin-configured `ProductPlan` compatibility records define valid pairings. Subscriptions reject unmapped or inactive combinations.

4. **Subscriptions**:
   - Locked agreed unit pricing: Product, variant, and plan prices are snapshotted at creation time so future catalog price changes do not impact active subscriptions.
   - Lifecycle transitions: `DRAFT` -> `CONFIRMED` -> `ACTIVE` -> `PAUSED` -> `CLOSED`.
   - **Pause & Resume**: Pausing a subscription suspends recurring invoice generation. Resuming automatically shifts the `nextBillingDate` forward by the duration paused.

5. **Invoices**:
   - Recurring invoice generation for due active subscriptions (`POST /api/invoices/generate`).
   - **Duplicate Invoice Prevention**: Enforced both via database unique constraint `uk_sub_billing_period` on `(subscription_id, billing_period)` and transactional pre-checks.
   - Line items preserve snapshots of unit price, discounts, and taxes.

6. **Payments**:
   - Allows multiple partial payments per invoice.
   - Automatically computes `amountDue = total - totalRecordedPayments`.
   - Updates invoice status to `PARTIALLY_PAID` or `PAID` once the balance reaches zero.
   - **Overpayment Rejection**: Strictly rejects payments exceeding the outstanding balance.

7. **Dashboard Analytics**:
   - `GET /api/dashboard/summary` returns:
     - `activeSubscriptions`: Count of active subscriptions.
     - `revenueReceived`: Actual payments collected (optionally filtered by `startDate` and `endDate`).
     - `amountOwed`: Total outstanding balance from confirmed/unpaid invoices.
     - `overdueInvoices`: Count of past-due invoices.

---

## Frontend Integration
Please refer to [API_CONTRACT.md](API_CONTRACT.md) for the complete JSON request/response structures, error formats, and endpoint definitions for React integration.
