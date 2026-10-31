# SubscriptIQ (ODOO_2026)

Subscription management platform built with **React + Spring Boot**.

## Features

- **Products & Variants** — manage products with multiple variants and price adjustments
- **Plans** — billing plans with MONTHLY, YEARLY, and WEEKLY intervals, lifecycle rules (AUTO_RENEW, MANUAL_RENEWAL, AUTO_CLOSE)
- **Product-Plan Compatibility** — define which plans work with which products
- **Subscriptions** — full lifecycle: DRAFT, CONFIRMED, ACTIVE, PAUSED, CLOSED
- **Invoices** — auto-generated from subscriptions, supports CONFIRMED, PAID, PARTIALLY_PAID, OVERDUE, DRAFT, CANCELLED
- **Payments** — record partial/full payments against invoices
- **Discount Rules** — percentage or fixed discounts with minimum purchase, date ranges, and usage limits
- **Tax Rules** — configurable tax rates applied to invoices
- **Dashboard** — summary of active subscriptions, revenue received, amount owed, invoice counts
- **Renewal Alerts** — upcoming subscription renewal notifications
- **Role-Based Access** — ADMIN, STAFF, and CUSTOMER roles with UI and API guards

## Tech Stack

| Layer | Stack |
|-------|-------|
| Backend | Spring Boot 4.1.2, Java 21, Spring Security (JWT), Spring Data JPA, Lombok, Jackson |
| Frontend | React, Vite, React Router, Context API |
| Database | MySQL 8 (production), H2 in-memory (test/dev) |
| Testing | JUnit 5 + Mockito (backend), Node smoke harness (frontend mock contract) |

## Project Structure

```
ODOO_2026/
├── backend/
│   ├── src/main/java/com/subscription/backend/
│   │   ├── auth/            # Authentication, JWT, user entity
│   │   ├── customer/        # Customer CRUD
│   │   ├── product/         # Product & variant management
│   │   ├── plan/            # Plans + product-plan compatibility
│   │   ├── subscription/    # Subscription lifecycle
│   │   ├── invoice/         # Invoice generation & management
│   │   ├── payment/         # Payment recording
│   │   ├── discount/        # Discount rules
│   │   ├── tax/             # Tax rules
│   │   ├── dashboard/       # Dashboard summary
│   │   ├── security/        # JWT provider, role enum
│   │   ├── config/          # Security, seeders, Jackson config
│   │   ├── exception/       # Global exception handling
│   │   └── common/          # Shared DTOs/errors
│   └── src/test/            # Unit tests (24 tests)
├── Frontend/
│   └── src/
│       ├── pages/           # Dashboard, Products, Plans, Subscriptions, Invoices, Discounts, Taxes
│       ├── components/      # Reusable UI (Button, Modal, DataTable, etc.)
│       ├── services/        # API client + mock adapter for zero-backend demo
│       ├── context/         # Auth + Toast contexts
│       └── App.jsx          # Routes with role guards
├── sample_data.sql          # MySQL seed data
├── test_backend_e2e.ps1     # PowerShell e2e script for live backend
└── CONTRIBUTORS.md
```

## API Routes

| Endpoint | Methods | Access |
|----------|---------|--------|
| `/api/auth/**` | POST /login, /register, /create-staff, GET /me | Public / Admin |
| `/api/customers` | GET, POST, PUT | Admin, Staff |
| `/api/products` | GET, POST | Admin, Staff |
| `/api/plans` | GET, POST, PUT | Admin, Staff |
| `/api/product-plans` | GET, POST, DELETE | Admin, Staff |
| `/api/subscriptions` | GET, POST | All roles |
| `/api/invoices` | GET, POST /generate, POST /{id}/confirm, POST /{id}/cancel | All roles |
| `/api/payments` | GET, POST | All roles |
| `/api/discounts/**` | GET, POST, PUT, DELETE | Admin only |
| `/api/taxes/**` | GET, POST, PUT, DELETE | Admin only |
| `/api/dashboard/summary` | GET | All roles |

## Frontend Routes

| Route | Page | Access |
|-------|------|--------|
| `/login` | LoginPage | Public |
| `/dashboard` | DashboardPage | All roles |
| `/products` | ProductsPage | Admin, Staff |
| `/plans` | PlansPage | Admin, Staff |
| `/subscriptions` | SubscriptionsPage | All roles |
| `/invoices` | InvoicesPage | All roles |
| `/discount-rules` | DiscountRulesPage | Admin only |
| `/tax-rules` | TaxRulesPage | Admin only |

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@subscriptiq.com` | `Admin@123` |
| Staff | `staff@subscriptiq.com` | `Staff@123` |
| Customer | `user@subscriptiq.com` | `User@123` |

## Getting Started

### Prerequisites

- Java 21+
- Maven 3.9+ (or use included `mvnw`)
- MySQL 8 (production) or H2 (test/dev)
- Node.js 18+ and npm

### Backend

```bash
cd backend
./mvnw spring-boot:run
```

Backend runs on `http://localhost:8080`.

For H2 (no MySQL), use the dev profile:
```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

H2 console: `http://localhost:8080/h2-console` (JDBC: `jdbc:h2:mem:devdb`, user `sa`, no password).

Run tests:
```bash
./mvnw test
```

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

Toggle between mock and live backend:
```bash
VITE_USE_MOCK=true npm run dev   # Mock data (no backend)
VITE_USE_MOCK=false npm run dev  # Real backend on :8080
```

Build for production:
```bash
npm run build
```

## Mock Mode

The frontend includes a full in-memory mock API (`mockAdapter.js` + `mockData.js`) that mimics the backend contract. It seeds realistic demo data (6 customers, 6 products, 5 plans, subscriptions, invoices, payments, discount/tax rules) and supports the complete workflow without a running backend.

## Testing

**Backend:** 24 JUnit 5 tests (unit + integration with H2).
**Frontend:** Node.js smoke harness (`workspace/odoo2026-test.mjs`) drives the mock API end-to-end with accounting invariants (24 assertions).

## License

MIT
