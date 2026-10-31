# SubscriptIQ – Premium Subscription Management System (Frontend)

An enterprise-grade React dashboard for recurring billing, subscription lifecycle management, invoice generation, payment reconciliation, and revenue telemetry. Built for seamless integration with a Java Spring Boot REST backend and MySQL persistence layer.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v18+ (tested on Node v24.21.0)
- **npm**: v9+ (tested on npm 11.19.0)

### Installation & Launch

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

The application will launch on `http://localhost:5173/`.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | React 19 + Vite | High-performance single page application |
| **Routing** | React Router v7 | Declarative navigation, route guards, and role protection |
| **API Client** | Axios | Centralized HTTP client, JWT interceptors, error normalization |
| **Icons** | Lucide React | Professional enterprise iconography |
| **Styling** | Plain CSS + Design System | Deep navy sidebar theme, light surface typography, zero heavy UI dependencies |
| **Mock Engine** | In-Memory / LocalStorage Adapter | Zero-backend standalone demo execution with instant role switching |

---

## 🎨 Enterprise Design System

The application strictly adheres to the design specification:
- **Sidebar**: Deep navy surface (`#09132B`) with accent cyan highlights (`#38BDF8`).
- **Surfaces**: Crisp white cards (`#FFFFFF`) with subtle slate borders (`#E2E8F0`) and light grey canvas (`#F8FAFC`).
- **Primary Accent**: Professional financial blue (`#2563EB`).
- **Typography & Components**: Clean typography, status badges with dot indicators, accessible forms, itemized tables, modal dialogues, and responsive cards.

---

## 🔐 User Roles & Route Guard Protection

| Role | Access Level | Permitted Pages |
| :--- | :--- | :--- |
| **`ADMIN`** | Full System Access | Dashboard, Products, Plans, Subscriptions, Invoices, Discount Rules, Tax Rules |
| **`STAFF`** | Operational | Dashboard, Products, Plans, Subscriptions, Invoices (Cannot manage rules) |
| **`CUSTOMER`** | Isolated Ownership | Subscriptions (own records only), Invoices (own records only) |

### Demo Role Switcher
During hackathon demonstrations, use the **Role Switcher** in the top navigation bar to seamlessly toggle between **ADMIN**, **STAFF**, and **CUSTOMER** views with 1 click to demonstrate customer data isolation and route guards.

### Quick Demo Logins
- **Admin**: `admin@subscriptiq.io` / `password123`
- **Staff**: `staff@brightloop.com` / `password123`
- **Customer**: `billing@acroindustries.com` / `password123`

---

## 🔄 Dual-Mode Backend Strategy (Mock Mode vs. Live API)

The frontend features a configurable dual-mode system:

1. **Mock Mode (`VITE_USE_MOCK=true`)**:
   - Allows 100% functional standalone execution without waiting for the Spring Boot backend to be started.
   - Seeded with realistic sample data: Cloud platform products, compute variants, quarterly plans, subscriptions, partially paid invoices, and overdue tracking.
   - Supports in-browser state persistence across page refreshes.

2. **Live Backend Mode (`VITE_USE_MOCK=false`)**:
   - Sends real REST requests to the Java Spring Boot backend at `VITE_API_BASE_URL` (default: `http://localhost:8080`).
   - Automatically injects `Authorization: Bearer <JWT>` header on every request.

You can toggle between modes either via the `.env` file or by clicking the **"Mode" badge pill** in the top bar.

---

## 📋 REST API Contract Reference

The frontend calls ONLY the exact endpoints specified in Section 6 of the blueprint:

```
AUTH:
  POST /api/auth/login
  POST /api/auth/register

PRODUCTS:
  GET  /api/products
  POST /api/products
  GET  /api/products/{id}
  PUT  /api/products/{id}

PLANS:
  GET  /api/plans
  POST /api/plans
  GET  /api/plans/{id}
  PUT  /api/plans/{id}

PRODUCT-PLAN COMPATIBILITY:
  GET  /api/products/{id}/plans
  PUT  /api/products/{id}/plans

SUBSCRIPTIONS & LIFECYCLE:
  POST /api/subscriptions
  GET  /api/subscriptions
  GET  /api/subscriptions/{id}
  POST /api/subscriptions/{id}/pause
  POST /api/subscriptions/{id}/resume
  POST /api/subscriptions/{id}/close
  POST /api/subscriptions/{id}/renew

BILLING & INVOICES:
  POST /api/billing/run
  GET  /api/invoices
  GET  /api/invoices/{id}
  POST /api/invoices/{id}/confirm

PAYMENTS:
  POST /api/invoices/{id}/payments
  GET  /api/invoices/{id}/payments

DISCOUNT & TAX RULES:
  GET  /api/discount-rules
  POST /api/discount-rules
  GET  /api/tax-rules
  POST /api/tax-rules

DASHBOARD:
  GET  /api/dashboard/summary?from=...&to=...
```

---

## 📝 API Contract Details Requiring Teammate Confirmation

The frontend has been built flexibly to adapt to the Spring Boot backend. The following points should be reviewed and agreed upon with the backend team:

1. **Dashboard Query Parameter**:
   - The blueprint document had a potential typo: `GET /api/dashboard/summary?from=...&to;=...`.
   - **Frontend implementation**: Currently passes clean `from` and `to` query parameters (`?from=2026-01-01&to=2026-12-31`). Verify the Spring Boot `@RequestParam` name matches.

2. **Auth Token Structure**:
   - The frontend expects `{ token: "...", user: { id, name, email, role } }`.
   - If the backend returns `{ accessToken: "...", roles: ["ROLE_ADMIN"] }`, the mapper in `src/services/api.js` can be easily configured.

3. **Product-Plan Compatibility PUT Schema**:
   - Endpoint: `PUT /api/products/{id}/plans`.
   - Frontend currently sends `{ planIds: ["plan_1", "plan_2"] }`. If backend expects a raw JSON array `["plan_1", "plan_2"]`, update `src/services/productService.js`.

4. **Error Response Envelope**:
   - Frontend extracts errors from `response.data.message`, `response.data.error`, or HTTP status text. Confirm if backend uses RFC 7807 Problem Details or custom JSON.

5. **Customer Scoping on Subscriptions and Invoices**:
   - Security rule: For `CUSTOMER` users, does the backend automatically extract customer identity from the JWT subject/claims, or does it require an explicit query parameter? (Recommended: extract from JWT).

---

## 📂 Project Architecture

```
frontend/
├── public/
│   └── favicon.svg
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── common/           # Button, Badge, Modal, ConfirmDialog, EmptyState, LoadingSpinner
│   │   ├── forms/            # FormInput, FormSelect, FormTextarea
│   │   ├── layout/           # Sidebar, TopNav, AppLayout
│   │   └── tables/           # DataTable with search & pagination
│   ├── context/              # AuthContext, ToastContext
│   ├── pages/
│   │   ├── Login/            # LoginPage (P0) with quick autofill
│   │   ├── Dashboard/        # DashboardPage (P0) with 4 metrics & chart
│   │   ├── Products/         # ProductsPage (P0), ProductModal, ProductPlansModal
│   │   ├── Plans/            # PlansPage (P0/P1), PlanModal
│   │   ├── Subscriptions/    # SubscriptionsPage (P0), CreateSubscriptionModal, SubscriptionDetailModal
│   │   ├── Invoices/         # InvoicesPage (P0), InvoiceDetailModal, RecordPaymentModal
│   │   ├── DiscountRules/    # DiscountRulesPage (P1), CreateDiscountRuleModal
│   │   ├── TaxRules/         # TaxRulesPage (P1), CreateTaxRuleModal
│   │   └── NotFound/         # 404 fallback page
│   ├── services/             # Dedicated API domain services
│   │   ├── api.js            # Central Axios client & mode toggle
│   │   ├── mockAdapter.js    # Local simulated REST engine
│   │   ├── mockData.js       # Realistic seed data
│   │   ├── authService.js
│   │   ├── productService.js
│   │   ├── planService.js
│   │   ├── subscriptionService.js
│   │   ├── invoiceService.js
│   │   ├── paymentService.js
│   │   ├── discountService.js
│   │   ├── taxService.js
│   │   └── dashboardService.js
│   ├── utils/                # formatters.js (currency, dates, badges)
│   ├── App.jsx               # Routes & RoleGuards
│   ├── main.jsx
│   ├── index.css             # Enterprise design system styles
│   └── App.css
├── .env.example
├── package.json
└── vite.config.js
```

---

## 🎯 Implementation Status Summary

| Feature / Page | Priority | Status | Implemented Functionality |
| :--- | :--- | :--- | :--- |
| **Login Page** | P0 | **Complete** | Email & password inputs, show/hide password, validation, demo autofills, role redirection |
| **Dashboard** | P0 | **Complete** | 4 primary metric cards, revenue chart, collection rate, date range filter, recent invoices & subscriptions, billing trigger |
| **Products** | P0 | **Complete** | Product CRUD, base sales/cost pricing, product variants with price adjustment (e.g. ₹5,000 + ₹560 = ₹5,560) |
| **Product-Plan Compatibility** | P0 | **Complete** | Assign allowed plans per product (`/api/products/{id}/plans`), enforcing valid combinations |
| **Plans** | P0/P1 | **Complete** | Plan CRUD, intervals (daily, weekly, monthly, yearly), minimum quantity, validity dates, lifecycle rules |
| **Subscriptions** | P0 | **Complete** | Create subscription, pricing snapshot locking, status indicators, line items, customer isolation |
| **Lifecycle Actions** | P0/P1 | **Complete** | Pause (suspends billing), Resume (advances due date), Close (stops future runs), Renew |
| **Billing Run** | P0 | **Complete** | `POST /api/billing/run` trigger, database-level duplicate invoice prevention, status update feedback |
| **Invoices** | P0 | **Complete** | Listing with overdue detection, line-item breakdown, tax and discount snapshotting, confirm invoice |
| **Payments** | P0/P1 | **Complete** | Full & partial payments (`POST /api/invoices/{id}/payments`), balance recalculation, settlement to PAID |
| **Discount Rules** | P1 | **Complete** | Percentage & flat discounts, minimum purchase/qty thresholds, start/end validity, max redemptions cap |
| **Tax Rules** | P1 | **Complete** | Tax rule creation, snapshot percentage rates, active/inactive status |
