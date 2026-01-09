# Vessify - Personal Finance Transaction Extractor

A production-realistic personal finance transaction extractor with AI-powered parsing, authentication, multi-tenancy, and data isolation.

## Features

- 🔐 **Secure Authentication** - Better Auth with session management
- 🏢 **Multi-tenancy** - Organization-based data isolation  
- 🤖 **AI Extraction** - Gemini-powered transaction parsing from messy text
- 📊 **Confidence Scoring** - Know how accurate each extraction is
- 🎨 **Modern UI** - Dark theme with shadcn/ui components

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Hono + TypeScript |
| Database | PostgreSQL (Neon) + Prisma ORM |
| Auth | Better Auth with organization plugin |
| Frontend | Next.js 15 (App Router) + TypeScript |
| UI | shadcn/ui + Tailwind CSS |
| AI | Google Gemini 2.5 Flash |

## Quick Start

### Prerequisites

- Node.js 18+
- Gemini API key ([Get one here](https://aistudio.google.com/apikey))

### 1. Backend Setup

```bash
cd vessify-backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Push database schema
npm run db:push

# Start server
npm run dev
```

### 2. Frontend Setup

```bash
cd vessify-frontend

# Install dependencies
npm install

# Start server
npm run dev
```

### 3. Access the Application

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:3001 |

---

## Test Users

Pre-created test accounts (create your own or use these):

| User | Email | Password |
|------|-------|----------|
| Alice Test | alice@test.com | password123 |
| Bob Demo | bob@test.com | password123 |

> **Data Isolation**: Alice and Bob cannot see each other's transactions.

---

## Sample Test Texts

Paste any of these into the extraction form:

### Sample 1 - Standard Format
```
Date: 11 Dec 2025
Description: STARBUCKS COFFEE MUMBAI
Amount: -420.00
Balance after transaction: 18,420.50
```
**Expected**: ₹420.00 debit, Food & Dining

### Sample 2 - Alternative Format
```
Uber Ride * Airport Drop
12/11/2025 → ₹1,250.00 debited
Available Balance → ₹17,170.50
```
**Expected**: ₹1,250.00 debit, Transportation

### Sample 3 - Messy Format
```
txn123 2025-12-10 Amazon.in Order #403-1234567-8901234 ₹2,999.00 Dr Bal 14171.50 Shopping
```
**Expected**: ₹2,999.00 debit, Shopping

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/sign-up/email` | ❌ | Register |
| POST | `/api/auth/sign-in/email` | ❌ | Login |
| GET | `/api/auth/session` | ✅ | Get session |
| POST | `/api/transactions/extract` | ✅ | Parse & save transaction |
| GET | `/api/transactions` | ✅ | Get transactions (paginated) |

---

## Running Tests

```bash
cd vessify-backend
npm test
```

### Test Coverage

| # | Test | Status |
|---|------|--------|
| 1 | Extract Sample 1 (Starbucks) | ✅ |
| 2 | Extract Sample 2 (Uber) | ✅ |
| 3 | Extract Sample 3 (Amazon) | ✅ |
| 4 | User creation | ✅ |
| 5 | Organization membership | ✅ |
| 6 | Cross-user data isolation | ✅ |

---

## Architecture

### Better Auth Setup
- Located in `src/lib/auth.ts`
- Uses Prisma adapter for database storage
- Organization plugin enables multi-tenancy
- Sessions stored with 7-day expiry

### Data Isolation Strategy
```typescript
// All queries filter by user AND organization
const transactions = await prisma.transaction.findMany({
  where: {
    userId: session.user.id,
    organizationId: org.id
  }
});
```

### Transaction Extraction Flow
1. User pastes bank statement text
2. Frontend sends to `/api/transactions/extract`
3. Gemini parses text → structured JSON
4. Backend validates and stores in DB
5. Response includes extracted data + confidence score

### Date Parsing Logic
The AI handles various formats, with fallback parsing:
- ISO 8601: `2025-12-11`
- DD/MM/YYYY: `11/12/2025`
- DD MMM YYYY: `11 Dec 2025`
- Fallback: Current date

### Pagination
- Uses cursor-based pagination for efficiency
- Query: `GET /api/transactions?cursor=<id>&limit=10`

---

## Environment Variables

### Backend (`vessify-backend/.env`)
```env
DATABASE_URL="file:./dev.db"
BETTER_AUTH_SECRET="your-secret-key-min-32-chars"
GEMINI_API_KEY="your-gemini-api-key"
FRONTEND_URL="http://localhost:3000"
PORT=3001
```

### Frontend (`vessify-frontend/.env.local`)
```env
NEXT_PUBLIC_BACKEND_URL="http://localhost:3001"
```

---

## Project Structure

```
Vessify/
├── vessify-backend/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── auth.ts      # Better Auth config
│   │   │   ├── prisma.ts    # Database client
│   │   │   └── gemini.ts    # AI extraction logic
│   │   ├── routes/
│   │   │   └── transactions.ts
│   │   └── __tests__/
│   │       └── api.test.ts  # 6 Jest tests
│   └── prisma/
│       └── schema.prisma    # Database schema
│
└── vessify-frontend/
    └── src/
        ├── app/
        │   ├── page.tsx         # Dashboard
        │   ├── login/page.tsx   # Login form
        │   └── register/page.tsx # Register form
        ├── lib/
        │   └── auth-client.ts   # Better Auth client
        └── components/ui/       # shadcn/ui components
```

---

## Security Features

- ✅ Secure password hashing (Better Auth)
- ✅ HTTP-only session cookies
- ✅ CORS configured for frontend origin
- ✅ Multi-tenant data isolation
- ✅ Input validation on API routes

## License

MIT
