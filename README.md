# 🧾 Vessify - Personal Finance Transaction Extractor

> A production-ready personal finance transaction extractor with AI-powered parsing, Better Auth authentication, multi-tenancy support, and strict data isolation.

![Tech Stack](https://img.shields.io/badge/Backend-Hono%20%2B%20TypeScript-blue)
![Auth](https://img.shields.io/badge/Auth-Better%20Auth-green)
![Frontend](https://img.shields.io/badge/Frontend-Next.js%2015-black)
![AI](https://img.shields.io/badge/AI-Gemini%202.5%20Flash-orange)
![Database](https://img.shields.io/badge/Database-PostgreSQL-336791)

---

## ✨ Features

- 🔐 **Secure Authentication** - Better Auth with email/password + session management
- 🏢 **Multi-tenancy** - Organization-based data isolation per user
- 🤖 **AI Extraction** - Gemini-powered transaction parsing from messy bank statement text
- 📊 **Confidence Scoring** - Know how accurate each extraction is
- 📄 **Cursor Pagination** - Efficient infinite scroll for transaction history
- 🎨 **Modern UI** - Dark theme with shadcn/ui components

---

## 🛠️ Tech Stack

| Layer      | Technology                             |
| ---------- | -------------------------------------- |
| Backend    | Hono + TypeScript                      |
| Database   | PostgreSQL (Neon/Local) + Prisma ORM   |
| Auth       | Better Auth with Organization Plugin   |
| Frontend   | Next.js 15 (App Router) + TypeScript   |
| UI         | shadcn/ui + Tailwind CSS v4            |
| AI         | Google Gemini 2.5 Flash                |

---

## 📁 Project Structure

```
Vessify/
├── vessify-backend/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── auth.ts          # Better Auth configuration
│   │   │   ├── prisma.ts        # Database client
│   │   │   └── gemini.ts        # AI extraction logic
│   │   ├── routes/
│   │   │   └── transactions.ts  # Transaction API routes
│   │   ├── __tests__/           # Jest test suite
│   │   └── index.ts             # Server entry point
│   └── prisma/
│       └── schema.prisma        # Database schema
│
└── vessify-frontend/
    └── src/
        ├── app/
        │   ├── page.tsx             # Dashboard (protected)
        │   ├── login/page.tsx       # Login form
        │   └── register/page.tsx    # Registration form
        ├── lib/
        │   └── auth-client.ts       # Better Auth client
        └── components/ui/           # shadcn/ui components
```

---

## 🔧 Environment Variables

### Backend (`vessify-backend/.env.example`)

```env
# Database Connection (PostgreSQL)
DATABASE_URL="postgres://postgres:postgres@localhost:5432/vessify"

# Better Auth Secret (min 32 characters for security)
BETTER_AUTH_SECRET="vessify-secret-key-change-in-production-2024"

# Google Gemini API Key (get from https://aistudio.google.com/apikey)
GEMINI_API_KEY="your-gemini-api-key-here"

# Frontend URL for CORS
FRONTEND_URL="http://localhost:3000"

# Server Port
PORT=3001
```

### Frontend (`vessify-frontend/.env.local`)

```env
# Backend API URL
NEXT_PUBLIC_BACKEND_URL="http://localhost:3001"
```

---

## 🚀 Quick Start - Setup Instructions

### Prerequisites

- **Node.js** v18+ (v20+ recommended)
- **PostgreSQL** database (local or cloud like [Neon](https://neon.tech))
- **Gemini API Key** - [Get one here](https://aistudio.google.com/apikey)

---

### Step 1: Clone & Install

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/Vessify.git
cd Vessify
```

---

### Step 2: Backend Setup

```bash
# Navigate to backend
cd vessify-backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env and add your values:
# - DATABASE_URL (your PostgreSQL connection string)
# - BETTER_AUTH_SECRET (any secure 32+ char string)
# - GEMINI_API_KEY (from Google AI Studio)

# Generate Prisma client
npm run db:generate

# Push database schema to PostgreSQL
npm run db:push

# Start development server
npm run dev
```

✅ Backend runs at: **http://localhost:3001**

---

### Step 3: Frontend Setup

```bash
# Open a new terminal, navigate to frontend
cd vessify-frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local if needed (default is http://localhost:3001)

# Start development server
npm run dev
```

✅ Frontend runs at: **http://localhost:3000**

---

### Step 4: Access the Application

| Service   | URL                     |
| --------- | ----------------------- |
| Frontend  | http://localhost:3000   |
| Backend   | http://localhost:3001   |

---

## 👤 Test User Credentials

Two pre-configured test accounts for evaluation:

| User              | Email             | Password       | Organization               |
| ----------------- | ----------------- | -------------- | -------------------------- |
| **Alice Test**    | alice@test.com    | password123    | Alice's Transactions       |
| **Bob Demo**      | bob@test.com      | password123    | Bob's Transactions         |

> ⚠️ **Note**: You need to register these users first via the registration page. Each user gets an auto-created personal organization for data isolation.

### Creating Test Users

1. Go to http://localhost:3000/register
2. Register **Alice Test** with email `alice@test.com` and password `password123`
3. Add some transactions, then logout
4. Register **Bob Demo** with email `bob@test.com` and password `password123`
5. Add some transactions as Bob
6. Verify Bob **cannot** see Alice's transactions

---

## 🧪 Sample Transaction Texts

Paste any of these into the extraction form to test:

### Sample 1 - Standard Bank Statement Format
```
Date: 11 Dec 2025
Description: STARBUCKS COFFEE MUMBAI
Amount: -420.00
Balance after transaction: 18,420.50
```
**Expected Output**: ₹420.00 debit, Category: Food & Dining

### Sample 2 - SMS/Notification Style
```
Uber Ride * Airport Drop
12/11/2025 → ₹1,250.00 debited
Available Balance → ₹17,170.50
```
**Expected Output**: ₹1,250.00 debit, Category: Transportation

### Sample 3 - Messy/One-line Format
```
txn123 2025-12-10 Amazon.in Order #403-1234567-8901234 ₹2,999.00 Dr Bal 14171.50 Shopping
```
**Expected Output**: ₹2,999.00 debit, Category: Shopping

---

## 🔌 API Endpoints

| Method | Endpoint                      | Auth | Description                    |
| ------ | ----------------------------- | ---- | ------------------------------ |
| POST   | `/api/auth/sign-up/email`     | ❌   | Register new user              |
| POST   | `/api/auth/sign-in/email`     | ❌   | Login                          |
| POST   | `/api/auth/sign-out`          | ✅   | Logout                         |
| GET    | `/api/auth/session`           | ✅   | Get current session            |
| POST   | `/api/transactions/extract`   | ✅   | Parse & save transaction       |
| GET    | `/api/transactions`           | ✅   | Get transactions (paginated)   |

### Pagination Query Parameters

```
GET /api/transactions?cursor=<ISO_DATE>&limit=10
```

---

## 🧪 Running Tests

```bash
cd vessify-backend
npm test
```

### Test Coverage

| #  | Test Description                  | Status |
| -- | --------------------------------- | ------ |
| 1  | Extract Sample 1 (Starbucks)      | ✅     |
| 2  | Extract Sample 2 (Uber)           | ✅     |
| 3  | Extract Sample 3 (Amazon)         | ✅     |
| 4  | User creation via Better Auth     | ✅     |
| 5  | Organization auto-creation        | ✅     |
| 6  | Cross-user data isolation         | ✅     |

---

## 🏗️ Architecture & Better Auth Integration

### Better Auth Setup Approach

Better Auth is configured with the **Organization Plugin** to enable multi-tenancy and data isolation at scale. Here's our approach:

> **We use Better Auth's organization plugin to automatically create a personal organization for each user upon their first transaction extraction. All transactions are then scoped by both `userId` AND `organizationId`, ensuring complete data isolation between users. This architecture scales naturally to support shared team workspaces in the future—just invite users to an organization, and they can view shared financial data while remaining isolated from other organizations.**

### Data Isolation Strategy

```typescript
// src/routes/transactions.ts - All queries enforce isolation
const transactions = await prisma.transaction.findMany({
  where: {
    userId: session.user.id,
    organizationId: member.organizationId, // Strict org isolation
  },
  orderBy: { createdAt: "desc" },
});
```

### Authentication Flow

1. User registers → Better Auth creates User + Account + Session records
2. First transaction → Auto-create personal Organization + Member record
3. All subsequent queries filter by `userId` + `organizationId`
4. Session cookies are HTTP-only with 7-day expiry

### Database Schema (Prisma)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  sessions      Session[]
  transactions  Transaction[]
  members       Member[]       // Organization memberships
}

model Transaction {
  id             String       @id @default(cuid())
  userId         String
  organizationId String       // Enforces multi-tenant isolation
  date           DateTime
  description    String
  amount         Float
  category       String?
  confidence     Float        // AI extraction confidence score
}
```

---

## 📊 Pagination Implementation

We use **cursor-based pagination** for efficient infinite scroll:

```typescript
// Backend implementation
const items = await prisma.transaction.findMany({
  where: {
    userId,
    organizationId,
    ...(cursor && { createdAt: { lt: new Date(cursor) } }),
  },
  orderBy: { createdAt: "desc" },
  take: limit + 1, // Fetch one extra to check for more
});

let nextCursor = null;
if (items.length > limit) {
  nextCursor = items.pop().createdAt.toISOString();
}
```

---

## 🔒 Security Features

- ✅ Passwords hashed via Better Auth (bcrypt)
- ✅ HTTP-only session cookies
- ✅ CORS configured for frontend origin only
- ✅ Multi-tenant data isolation (user + org scoping)
- ✅ Input validation with Zod schemas
- ✅ Environment variables for all secrets

---

## 📝 AI Tools Disclosure

The following AI tools were used during development:

- **GitHub Copilot** - Code autocompletion

---



## 📄 License

MIT

