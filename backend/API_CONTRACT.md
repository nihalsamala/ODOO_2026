# SubscriptIQ — Frontend-Backend API Contract

This document provides the full API specification for the React frontend developer integrating with the SubscriptIQ backend.

## Base URL
`http://localhost:8080/api`

---

## Authentication & Authorization
All secured endpoints expect an HTTP Header:
```http
Authorization: Bearer <token>
```
CORS is pre-configured to accept requests from `http://localhost:3000`, `http://localhost:5173`, `http://localhost:4173`, `http://127.0.0.1:3000`, and `http://127.0.0.1:5173` with credentials and standard methods.

### Default Seeded Accounts (for Development & Testing)
| Role | Email | Password |
|---|---|---|
| ADMIN | `admin@subscriptiq.com` | `Admin@123` |

---

## 1. Authentication Endpoints

### 1.1 Customer Registration
`POST /api/auth/register`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "customer@example.com",
  "password": "Password@123",
  "fullName": "Jane Doe",
  "phone": "+1-555-0199",
  "address": "123 Market St, Suite 400"
}
```
- **Response** (`201 Created`):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "type": "Bearer",
  "userId": 2,
  "email": "customer@example.com",
  "fullName": "Jane Doe",
  "role": "CUSTOMER",
  "customerId": 1
}
```

### 1.2 Login
`POST /api/auth/login`
- **Access**: Public
- **Request Body**:
```json
{
  "email": "admin@subscriptiq.com",
  "password": "Admin@123"
}
```
- **Response** (`200 OK`):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "type": "Bearer",
  "userId": 1,
  "email": "admin@subscriptiq.com",
  "fullName": "SubscriptIQ Admin",
  "role": "ADMIN",
  "customerId": null
}
```

### 1.3 Create Staff Account
`POST /api/auth/create-staff`
- **Access**: `ADMIN` only
- **Request Body**:
```json
{
  "email": "staff1@subscriptiq.com",
  "password": "Staff@123",
  "fullName": "Alex Rivera"
}
```
- **Response** (`201 Created`): Returns user object (`role: "STAFF"`).

### 1.4 Current User Profile
`GET /api/auth/me`
- **Access**: Authenticated

---

## 2. Products & Variants

### 2.1 List Products
`GET /api/products?activeOnly=true`
- **Response** (`200 OK`):
```json
[
  {
    "id": 1,
    "name": "Cloud Hosting Enterprise",
    "type": "SERVICE",
    "salesPrice": 120.00,
    "costPrice": 45.00,
    "notes": "Dedicated virtual instance",
    "active": true,
    "variants": [
      {
        "id": 1,
        "productId": 1,
        "name": "Extra 32GB RAM",
        "priceAdjustment": 30.00,
        "effectivePrice": 150.00,
        "active": true
      }
    ],
    "createdAt": "2026-10-31T10:00:00"
  }
]
```

### 2.2 Create Product
`POST /api/products`
- **Access**: Staff / Admin
- **Request Body**:
```json
{
  "name": "Cloud Hosting Enterprise",
  "type": "SERVICE",
  "salesPrice": 120.00,
  "costPrice": 45.00,
  "notes": "Dedicated virtual instance",
  "active": true,
  "variants": [
    {
      "name": "Extra 32GB RAM",
      "priceAdjustment": 30.00,
      "active": true
    }
  ]
}
```
- **Response** (`201 Created`): Returns created product.

### 2.3 Update Product
`PUT /api/products/{id}`

### 2.4 Add Product Variant
`POST /api/products/{id}/variants`
- **Request Body**:
```json
{
  "name": "NVMe 1TB Storage Expansion",
  "priceAdjustment": 25.00,
  "active": true
}
```
- **Response** (`201 Created`)

---

## 3. Plans & Product Compatibility

### 3.1 List Plans
`GET /api/plans?activeOnly=true`
- **Response** (`200 OK`):
```json
[
  {
    "id": 1,
    "name": "Monthly Pro",
    "price": 15.00,
    "billingInterval": "MONTHLY",
    "minimumQuantity": 1,
    "availabilityStartDate": "2026-01-01",
    "availabilityEndDate": "2026-12-31",
    "lifecycleRule": "AUTO_RENEW",
    "active": true
  }
]
```

### 3.2 Create Plan
`POST /api/plans`
- **Access**: Staff / Admin
- **Request Body**:
```json
{
  "name": "Monthly Pro",
  "price": 15.00,
  "billingInterval": "MONTHLY",
  "minimumQuantity": 1,
  "availabilityStartDate": "2026-01-01",
  "availabilityEndDate": null,
  "lifecycleRule": "AUTO_RENEW",
  "active": true
}
```
- **Billing Intervals**: `DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`
- **Lifecycle Rules**: `AUTO_CLOSE`, `AUTO_RENEW`, `MANUAL_RENEWAL`

### 3.3 List Product-Plan Compatibility
`GET /api/product-plans?activeOnly=true`

### 3.4 Link Product & Plan
`POST /api/product-plans`
- **Request Body**:
```json
{
  "productId": 1,
  "planId": 1,
  "active": true
}
```
- **Response** (`201 Created`)

---

## 4. Customers

### 4.1 List Customers
`GET /api/customers`
- **Access**: Staff/Admin see all; Customers see only their own record.

### 4.2 Create Customer
`POST /api/customers`
- **Request Body**:
```json
{
  "name": "Acme Innovations",
  "email": "contact@acme.com",
  "phone": "+1-800-555-0199",
  "address": "742 Evergreen Terrace"
}
```
- **Response** (`201 Created`)

---

## 5. Subscriptions

### 5.1 Create Subscription
`POST /api/subscriptions`
- **Request Body**:
```json
{
  "customerId": 1,
  "productId": 1,
  "planId": 1,
  "variantId": 1,
  "quantity": 2,
  "startDate": "2026-11-01",
  "expiryDate": "2027-11-01",
  "agreedUnitPrice": null,
  "initialStatus": "ACTIVE"
}
```
*Note: If `agreedUnitPrice` is null, the backend automatically calculates and permanently locks `product.salesPrice + variant.priceAdjustment + plan.price`.*

- **Response** (`201 Created`):
```json
{
  "id": 1,
  "subscriptionNumber": "SUB-9A1F2B3C",
  "customerId": 1,
  "customerName": "Acme Innovations",
  "planId": 1,
  "planName": "Monthly Pro",
  "productId": 1,
  "productName": "Cloud Hosting Enterprise",
  "variantId": 1,
  "variantName": "Extra 32GB RAM",
  "quantity": 2,
  "startDate": "2026-11-01",
  "expiryDate": "2027-11-01",
  "nextBillingDate": "2026-11-01",
  "agreedUnitPrice": 165.00,
  "subtotal": 330.00,
  "status": "ACTIVE",
  "pausedAt": null,
  "createdAt": "2026-10-31T10:15:00"
}
```

### 5.2 Subscription Lifecycle Endpoints
- `POST /api/subscriptions/{id}/confirm` (DRAFT/QUOTATION -> CONFIRMED)
- `POST /api/subscriptions/{id}/activate` (CONFIRMED/DRAFT -> ACTIVE)
- `POST /api/subscriptions/{id}/pause` (ACTIVE -> PAUSED; suspends invoice generation)
- `POST /api/subscriptions/{id}/resume` (PAUSED -> ACTIVE; shifts `nextBillingDate` by paused duration)
- `POST /api/subscriptions/{id}/close` (Terminal state)

---

## 6. Invoices

### 6.1 List Invoices
`GET /api/invoices?customerId=1&status=CONFIRMED`

### 6.2 Get Invoice by ID
`GET /api/invoices/{id}`
- **Response** (`200 OK`):
```json
{
  "id": 1,
  "invoiceNumber": "INV-7D8E9F1A",
  "subscriptionId": 1,
  "subscriptionNumber": "SUB-9A1F2B3C",
  "customerId": 1,
  "customerName": "Acme Innovations",
  "customerEmail": "contact@acme.com",
  "billingPeriod": "2026-11-01 to 2026-11-30",
  "billingPeriodStart": "2026-11-01",
  "billingPeriodEnd": "2026-11-30",
  "issueDate": "2026-10-31",
  "dueDate": "2026-11-15",
  "subtotal": 330.00,
  "discountAmount": 0.00,
  "taxAmount": 0.00,
  "total": 330.00,
  "amountPaid": 0.00,
  "outstandingBalance": 330.00,
  "status": "CONFIRMED",
  "lines": [
    {
      "id": 1,
      "description": "Cloud Hosting Enterprise (Extra 32GB RAM) - Monthly Pro (MONTHLY)",
      "quantity": 2,
      "unitPrice": 165.00,
      "discountAmount": 0.00,
      "taxRate": 0.00,
      "taxAmount": 0.00,
      "lineTotal": 330.00
    }
  ],
  "createdAt": "2026-10-31T10:20:00"
}
```

### 6.3 Generate Invoices
`POST /api/invoices/generate?subscriptionId=1`
`POST /api/invoices/generate?asOfDate=2026-11-01`
- Generates invoices for due subscriptions and advances `nextBillingDate`.
- Automatically enforces duplicate invoice prevention on `(subscription_id, billing_period)`.

---

## 7. Payments

### 7.1 Record Payment
`POST /api/payments`
- **Request Body**:
```json
{
  "invoiceId": 1,
  "amount": 100.00,
  "paymentMethod": "CREDIT_CARD",
  "paymentDate": "2026-11-02",
  "note": "Partial card payment via Stripe"
}
```
- **Response** (`201 Created`):
```json
{
  "id": 1,
  "paymentNumber": "PAY-F1A2B3C4",
  "invoiceId": 1,
  "invoiceNumber": "INV-7D8E9F1A",
  "customerId": 1,
  "customerName": "Acme Innovations",
  "amount": 100.00,
  "paymentMethod": "CREDIT_CARD",
  "paymentDate": "2026-11-02",
  "note": "Partial card payment via Stripe",
  "invoiceStatus": "PARTIALLY_PAID",
  "remainingOutstandingBalance": 230.00,
  "createdAt": "2026-10-31T10:25:00"
}
```
*Note: Overpayment is strictly rejected with HTTP 409/400. Once the remaining balance hits 0.00, invoice status automatically updates to `PAID`.*

---

## 8. Dashboard Summary

### 8.1 Summary Metrics
`GET /api/dashboard/summary?startDate=2026-10-01&endDate=2026-10-31`
- Optional query params: `startDate`, `endDate` (ISO format `YYYY-MM-DD`).
- **Response** (`200 OK`):
```json
{
  "activeSubscriptions": 42,
  "revenueReceived": 15450.00,
  "amountOwed": 3200.00,
  "overdueInvoices": 3,
  "totalCustomers": 28,
  "totalInvoices": 65
}
```

---

## 9. Error Response Contract
All errors return a consistent JSON structure:
```json
{
  "status": 409,
  "message": "Duplicate invoice: An invoice already exists for Subscription SUB-9A1F2B3C and billing period 2026-11-01 to 2026-11-30",
  "errors": null,
  "timestamp": "2026-10-31T10:30:00"
}
```
Validation errors return field errors:
```json
{
  "status": 400,
  "message": "Validation failed for one or more fields",
  "errors": {
    "email": "Valid email is required",
    "name": "Product name is required"
  },
  "timestamp": "2026-10-31T10:30:00"
}
```
