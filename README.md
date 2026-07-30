# Admissions Navigator

I actually think this is the correct scope. If I were building this as a software architect, I'd intentionally **exclude AI call audit, WhatsApp, SMS, and payment** from Phase 1. Those are integration-heavy and don't prove the core admissions workflow.

What you've described is essentially an **Admissions Workflow Engine**, and it can absolutely be built with Laravel as a clean enterprise application.

# Product Vision

A centralized admissions workflow platform that manages a student from the moment they submit an enquiry until their entrance examination hall ticket is generated.

The platform acts as the single source of truth for admissions.

---

# Phase 1 Scope

## Module 1 — Public Inquiry Portal

Student fills

* Name

* DOB

* School

* Grade/Course

* Parent details

* Email

* Phone

* Lead Source

↓

Submit

↓

Generate Student ID

↓

Persist to Database

↓

Status = NEW

↓

Send Welcome Email

---

## Module 2 — Lead Dashboard

Admin sees

```

New Leads

Assigned Leads

Contacted

Seminar 1 Pending

Seminar 1 Complete

Seminar 2 Pending

Seminar 2 Complete

Exam Pending

Hall Ticket Generated

```

Every lead lives in exactly one stage.

---

## Module 3 — Counsellor Management

Admin

* Create counsellors

* Enable/Disable

* Workload

Assign

```

Student A

↓

Counsellor 2

```

Assignment can initially be manual.

Automatic balancing can come later.

---

## Module 4 — Counsellor Dashboard

Counsellor sees

```

Today's Calls

Pending Calls

Completed Calls

Upcoming Follow Ups

```

Student profile

Call notes

Status

Next action

One button

```

Call Completed

```

---

## Module 5 — Email Automation

Once counsellor presses

```

Call Completed

```

Automatically

```

Email

↓

Thank You

↓

Seminar Registration Link

```

Only email.

No WhatsApp.

No SMS.

---

## Module 6 — Seminar Administration

Admin creates

```

Seminar

Date

Time

Capacity

Venue

```

Example

```

WOC

28 July

100 seats

```

---

## Module 7 — Student Registration

Eligible students receive

```

Email

↓

Book Seminar

```

System checks

Capacity

Books seat

Changes status

---

## Module 8 — QR Generation

After booking

Generate

```

PDF

Student ID

QR Code

Seminar

Date

Venue

```

Email automatically.

---

## Module 9 — Attendance Scanner

Ground Admin

Logs in

Camera

Scan QR

↓

Attendance Recorded

↓

Status Updated

---

## Module 10 — ACC Workflow

Exactly same workflow

Admin creates

↓

Email

↓

Booking

↓

QR

↓

Attendance

---

## Module 11 — Exam Administration

Admin creates

```

Exam

Date

Centre

Room

Capacity

```

Assign students

Automatically

or manually

---

## Module 12 — Hall Ticket Generator

Generate

PDF

Contains

* Student Name

* Student ID

* Exam

* Centre

* Room

* Date

* Time

* QR

Email automatically.

End of Phase 1.

---

# User Roles

```

Super Admin

↓

Admissions Admin

↓

Counsellor

↓

Ground Admin

↓

Student

```

---

# Core State Machine

```

NEW

↓

ASSIGNED

↓

CONTACTED

↓

WOC_BOOKED

↓

WOC_ATTENDED

↓

ACC_BOOKED

↓

ACC_ATTENDED

↓

EXAM_BOOKED

↓

HALL_TICKET_GENERATED

```

Everything simply moves the student from one state to the next.

---

# External Integrations (Phase 1)

### Email

* SMTP or Microsoft 365 / Google Workspace SMTP

* PDF attachments

* Transactional email queue

### PDF Generation

* Hall Tickets

* Seminar Tickets

### QR Code

Generate QR PNG/SVG

Embed into PDFs

### File Storage

Store

* PDFs

* QR Images

Initially on local storage

Later migrate to S3-compatible object storage

---

# Laravel Boilerplate Structure

```

app/

├── Domains/

│   ├── Admissions/

│   ├── Students/

│   ├── Counsellors/

│   ├── Seminars/

│   ├── Exams/

│   ├── Attendance/

│   ├── HallTickets/

│   ├── Notifications/

│   └── Users/

│

├── Actions/

├── Jobs/

├── Policies/

├── Events/

├── Listeners/

├── Mail/

├── Notifications/

└── Services/

routes/

    web.php

    api.php

resources/

    views/

        pdf/

        emails/

storage/

    app/

        halltickets/

        seminar_qr/

```

---

# Suggested Packages

| Purpose                      | Package                        |

| ---------------------------- | ------------------------------ |

| Authentication               | Laravel Breeze or Jetstream    |

| Roles & Permissions          | Spatie Laravel Permission      |

| PDF Generation               | barryvdh/laravel-dompdf        |

| QR Codes                     | simplesoftwareio/simple-qrcode |

| Excel Import/Export (future) | maatwebsite/excel              |

| Background Jobs              | Laravel Queues                 |

| Scheduler                    | Laravel Scheduler              |

| Email                        | Native Laravel Mail            |

---

## Deliverables at the End of Phase 1

* Public enquiry portal

* Student ID generation

* Central admissions dashboard

* Counsellor management

* Lead assignment

* Counsellor workflow

* Email-based communication

* WOC seminar scheduling and booking

* WOC QR generation and attendance

* ACC seminar scheduling and booking

* ACC QR generation and attendance

* Exam scheduling

* Hall ticket PDF generation with QR code

* Role-based access control

* State-driven admissions workflow

This gives you a clean, production-ready foundation. In subsequent phases, you can layer on WhatsApp/SMS, payment collection, CRM synchronization, AI call auditing, analytics dashboards, and richer automation without having to redesign the core architecture.


the readme is the tech stack that you will be using, image reference is to understand the layout, the bottom write is how i like to architect my project. use it as a sample and make the architecture according to it. 

High Performance Product Catalog API

Backend From First Principles — Project 13

Philosophy: Minimal Infrastructure. Maximum Functionality. Learn every backend optimization from first principles by implementing it yourself. No Docker. No unnecessary frontend. PostgreSQL + Express + Node.js.

Objective

This repository is a progressive backend engineering project. Instead of building many unrelated projects, this single backend evolves phase-by-phase into a production-style service while introducing the optimization techniques used in modern backend systems.

Each phase introduces one architectural concept, keeping implementation intentionally minimal while maximizing understanding.

Tech Stack

Node.js

Express.js

PostgreSQL

pg (node-postgres)

compression

In-Memory Cache (Map)

PowerShell / Insomnia for testing

Final Architecture

Client

    │

    ▼

Compression Middleware

    │

    ▼

Profiling Middleware

    │

    ▼

Traffic Control

    ├── Sliding Window  (GET /products)

    ├── Token Bucket    (POST /products)

    └── Leaky Bucket    (POST /products/bulk)

    │

    ▼

Product Controller

    │

    ├── Product Command Service    (writes)

    └── Product Query Service      (reads)

            │

            ▼

    Repository Layer

            │

    Connection Pool

            │

            ▼

        PostgreSQL

            │

    ┌───────┴───────┐

    ▼               ▼

Products Table   Materialized View (popular_products)

─────────────────────────────────────────

Background Worker → REFRESH MATERIALIZED VIEW (every 30s)

─────────────────────────────────────────

In-Memory Cache → Cache Aside / Write Through / Read Through

─────────────────────────────────────────

Metrics Store → /metrics  /health  /cache

API Endpoints

Method	Endpoint	Rate Limiter	Description

GET	/api/v1/health	—	Application status + uptime

GET	/api/v1/metrics	—	Request count, avg response time, memory

GET	/api/v1/cache	—	Cache size, hits, misses, hit ratio

GET	/api/v1/pool	—	Connection pool stats

POST	/api/v1/products	Token Bucket	Create product

POST	/api/v1/products/bulk	Leaky Bucket	Bulk insert products

GET	/api/v1/products	Sliding Window	List products (filter + sort + cursor)

GET	/api/v1/products/popular	—	Top-5 from materialized view (cached)

GET	/api/v1/products/:id	—	Get by ID (cache aside)

PUT	/api/v1/products/:id	—	Update product (write through cache + audit)

DELETE	/api/v1/products/:id	—	Delete product

Query Parameters for GET /products

Parameter	Example	Description

category	Electronics	Filter by category

minPrice	50000	Minimum price filter

maxPrice	100000	Maximum price filter

sortBy	price, rating, name	Sort column (whitelisted)

order	asc, desc	Sort direction

cursor	15	Cursor-based pagination (last seen ID)

limit	10	Page size (default 10)

Phase Evolution

Phase 0 — Enterprise Architecture

Established the project structure before any business logic. Route → Controller → Service → Repository layering with a health endpoint.

Learned: Separation of concerns begins at the folder level.

Phase 1 — CRUD Baseline

Built the simplest possible Product API backed by PostgreSQL. SELECT *, no DTO, no pagination. This is the intentional baseline — every subsequent phase measures against it.

Learned: Having a working unoptimized baseline is the starting point for performance engineering.

Phase 2 — DTO (Data Transfer Object)

The service transforms database entities before returning them to the controller. Internal fields (supplier, internal_cost, created_at, updated_at) are stripped from responses.

Learned: DTO answers what should the client receive? — a different question from what does the database return?

Phase 3 — Projection

Changed SELECT * to SELECT id, name, category, price, rating in all queries. PostgreSQL now reads fewer columns from disk.

Learned: DTO reduces response payload. Projection reduces database I/O. They solve different problems and both are needed.

Phase 4 — Offset Pagination

Added LIMIT $1 OFFSET $2 to findAll. Accepts ?page=1&limit=10.

Learned: OFFSET N requires PostgreSQL to walk past N rows — gets expensive at large page numbers.

Phase 5 — Cursor Pagination

Replaced offset with WHERE id > $cursor ORDER BY id LIMIT $limit. Accepts ?cursor=15&limit=10.

Learned: Cursor pagination jumps directly to the next batch using the primary key index. Consistent performance regardless of dataset size.

Offset	Cursor

Mechanism	Skip N rows	WHERE id > last_seen

Deep page performance	Degrades	Constant

Jump to page N	Yes	No

Best for	Admin dashboards	User-facing feeds

Phase 6 — Dynamic Filtering

Built a WHERE 1=1 dynamic query builder in the repository. Filters accumulate as AND category = $1, AND price >= $2, etc. All values are parameterized.

Learned: Dynamic SQL built safely using $N placeholders and a flat values array. Never string-concatenate user input into SQL.

Phase 7 — Dynamic Sorting

Added sortBy and order parameters. Column names are validated against a whitelist before being interpolated into ORDER BY.

Learned: Column names cannot be parameterized — they require whitelisting. Values require parameterization. These are two different security concerns.

Phase 8 — Indexes & Query Plans

Seeded 5000 products. Ran EXPLAIN ANALYZE before and after adding indexes.

Before indexes	After indexes

Scan type	Seq Scan	Index Scan

Rows examined	5012	66

Execution time	19.2 ms	2.4 ms

Created: idx_products_category, idx_products_price, idx_products_rating DESC, idx_products_category_price (composite).

Learned: Database indexes are one of the highest-leverage optimizations. Zero application code changed for an 8× improvement.

Phase 9 — Bulk Operations

Added POST /products/bulk that builds a single parameterized INSERT ... VALUES ($1,...),($9,...),... from an array of products.

Learned: 100 individual INSERTs = 100 network round trips + 100 query parses. 1 bulk INSERT = 1 round trip. The database still inserts 100 rows; only the communication overhead changes.

Phase 10 — Connection Pooling

Configured pg.Pool with max: 5, idleTimeoutMillis: 30000, connectionTimeoutMillis: 2000. Added GET /pool to inspect live connection stats.

Learned: Creating a PostgreSQL connection involves a TCP handshake and authentication. A pool amortizes that cost across many requests by reusing connections.

Phase 11 — Transactions

Wrapped the update repository method in BEGIN / COMMIT / ROLLBACK using a dedicated connection borrowed from the pool (pool.connect()). Every product update now also inserts a row into product_audit.

Learned: All statements in a transaction must run on the same connection. This is why connection pooling precedes transactions in the learning order. pool.connect() borrows a dedicated connection; client.release() returns it.

Phase 12 — Caching Strategies

Implemented all three enterprise caching patterns in the same backend.

Strategy	Endpoint	How it works

Cache Aside	GET /products/:id	Check cache → miss → DB → populate cache

Write Through	PUT /products/:id	Update DB → immediately update cache

Read Through	GET /products/popular	Cache owns loading, app never calls DB directly

Learned: Cache Aside is best for entities read frequently and written occasionally. Write Through keeps cache synchronized with no stale reads. Read Through hides cache loading from application code.

Phase 13 — CQRS

Split product.service.js into productCommand.service.js (create, update, delete, bulkCreate) and productQuery.service.js (findAll, findById, findPopularProducts). Controller imports both. No API changes.

Learned: Commands and Queries have different concerns — Commands need transactions and consistency; Queries need caching and performance. Separating them lets each evolve independently.

Phase 14 — Materialized Views

Created a PostgreSQL materialized view:

CREATE MATERIALIZED VIEW popular_products AS

SELECT id, name, category, price, rating

FROM products ORDER BY rating DESC LIMIT 5

Repository now reads SELECT * FROM popular_products — a single scan of 5 pre-sorted rows.

Learned: A normal view re-executes the underlying query on every request. A materialized view stores the result physically. The trade-off is eventual consistency — data is stale until REFRESH MATERIALIZED VIEW runs.

Phase 15 — Background Worker

Added src/workers/materializedView.worker.js — a setInterval that runs REFRESH MATERIALIZED VIEW popular_products every 30 seconds. Started at server boot in server.js.

Learned: The same Producer–Consumer pattern from the Notification Service and News Feed Engine. The worker is completely independent of the HTTP request lifecycle.

Phase 16 — Traffic Control

Implemented all three major rate-limiting algorithms as Express middleware, each applied to the endpoint where it makes the most architectural sense.

Algorithm	Endpoint	Data Structure	Behavior

Sliding Window	GET /products	Map<IP, Timestamp[]>	Hard cutoff at 5 req/10s

Token Bucket	POST /products	Map<IP, Bucket>	5 tokens, 1 refill/sec, burst-friendly

Leaky Bucket	POST /products/bulk	Queue<Request>	One request per second, no rejection

Learned: Sliding Window is simple and exact. Token Bucket supports controlled bursts. Leaky Bucket converts bursty traffic into a steady processing rate — ideal for expensive operations.

Phase 17 — Observability & Performance

Added Gzip compression, request profiling middleware, SQL query timing, a metrics store, and three operational endpoints.

GET /api/v1/metrics  → { requests, averageResponseTime, memory }

GET /api/v1/health   → { status: "UP", uptime }

GET /api/v1/cache    → { hits, misses, hitRatio, cacheSize }

Learned: Every production backend needs to answer is it working? and what is it doing? Observability belongs in middleware and instrumentation layers — not in business logic. Zero controller changes required.

Key Comparisons

SELECT * vs Projection

Before: 11 columns transferred per row

After:   5 columns transferred per row

Offset vs Cursor Pagination

OFFSET 500000 → PostgreSQL walks 500,000 rows

WHERE id > 500000 → PostgreSQL uses primary key index directly

Before and After Indexes (Phase 8)

Seq Scan:   19.2 ms, 5012 rows examined

Index Scan:  2.4 ms,   66 rows examined

100 INSERTs vs 1 Bulk INSERT

Individual: 100 network round trips

Bulk:         1 network round trip

Setup

Prerequisites

Node.js

PostgreSQL running on localhost:5432

Install

cd product-catalog-api

npm install

Database Setup

node scripts/setup.js          # creates products table

node scripts/migrate.js        # creates product_audit table

node scripts/materialized_view.js  # creates popular_products view

node scripts/indexes.js        # creates performance indexes

node scripts/seed.js           # seeds 5000 products

Run

node server.js

Intentionally Not Implemented

Redis (in-memory Map used instead to teach the concept)

BullMQ / Kafka / RabbitMQ (setInterval used instead)

Docker

Prometheus / Grafana (in-memory metrics store used instead)

ORM (raw SQL used to stay close to the database)

Frontend

Repository Progression

Expense Tracker

    │  REST APIs & Persistence

    │

Redis Cache

    │  Caching Patterns

    │

Snowflake ID Generator

    │  Distributed ID Generation

    │

URL Shortener

    │  Encoding & Idempotency

    │

Distributed KV Store

    │  Distributed Systems

    │

Notification Service

    │  Asynchronous Processing

    │

Tiny Search Engine

    │  Information Retrieval

    │

Web Crawler

    │  Web Discovery & Graph Traversal

    │

News Feed Engine

    │  Social Graph & Feed Generation

    │

Search Autocomplete Engine

    │  Prefix Search & Trie Optimization

    │

High Performance Product Catalog API

      Performance Engineering & Backend Optimization

the below text shows how i want my frontend code architecture to be 

Principle	What it means
Thin app/ pages
Routes are ~3–15 lines. They import one client shell or stack section components. No business UI in page.tsx.
Feature folders
UI lives under components/{feature}/ grouped by page or domain, not by atomic type alone.
Barrel exports
Each feature folder has index.ts re-exporting public components. Pages import from @/components/about, not deep paths.
One global shell
Root layout + ClientLayout wrap every page with Nav + Footer. Pages only fill the middle.
Config & data outside UI
Constants, routes, static copy tables → config/ and data/. SEO helpers → lib/.
Client at the edge
Server page.tsx / layout.tsx for metadata & structured data; "use client" on interactive pages or *Client.tsx shells.
Full directory tree

project-root/
├── app/                          # Routes only (App Router)
│   ├── layout.tsx                # Root: fonts, metadata, ClientLayout wrapper
│   ├── globals.css
│   ├── icon.svg
│   ├── sitemap.ts
│   ├── not-found.tsx
│   │
│   ├── (home)/                   # Route group (no URL segment)
│   │   ├── layout.tsx            # Page-specific SEO / structured data
│   │   └── page.tsx              # → HomePageClient
│   │
│   ├── about/
│   │   ├── layout.tsx            # Metadata + breadcrumb schema
│   │   └── page.tsx              # Stacks about/* sections
│   ├── services/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── careers/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── policies/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── blog/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Listing
│   │   ├── [id]/
│   │   │   └── layout.tsx        # Dynamic metadata per article
│   │   ├── 1/page.tsx … 22/page.tsx   # Hardcoded article routes
│   ├── user-walkthrough/
│   │   ├── layout.tsx
│   │   └── page.tsx              # → UserWalkthroughClient
│   ├── vendor-onboarding/
│   │   ├── layout.tsx
│   │   └── page.tsx              # → VendorClient
│   ├── support/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── deactivate/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── news-events/
│       ├── layout.tsx
│       └── page.tsx
│
├── components/
│   ├── layout/                   # Global chrome
│   │   ├── ClientLayout.tsx      # Nav + children + Footer
│   │   ├── NavBar.tsx
│   │   ├── Footer.tsx
│   │   └── footer/               # Footer sub-parts
│   │       ├── index.ts          # Barrel
│   │       ├── BrandSection.tsx
│   │       ├── LegalBar.tsx
│   │       ├── ContactModal.tsx
│   │       ├── SocialMediaLinks.tsx
│   │       └── AppDownloadLinks.tsx
│   │
│   ├── home/                     # Landing page feature
│   │   ├── index.ts
│   │   ├── HomePageClient.tsx    # Page orchestrator (loading + main)
│   │   ├── LoadingScreen.tsx
│   │   ├── MainContent.tsx
│   │   ├── HeroSection.tsx
│   │   ├── FeatureSection.tsx
│   │   └── …
│   │
│   ├── about/                    # One folder per major route/feature
│   │   ├── index.ts
│   │   ├── FoundersStory.tsx
│   │   ├── Mission.tsx
│   │   └── …
│   ├── services/
│   ├── careers/
│   ├── policies/
│   ├── blog/
│   ├── vendor-onboarding/
│   ├── user-walkthrough/
│   ├── support/
│   ├── deactivate/
│   │
│   ├── shared/                   # Cross-route reusables
│   │   ├── index.ts
│   │   ├── AppLink.tsx
│   │   ├── BackButton.tsx
│   │   ├── Breadcrumb.tsx
│   │   └── StructuredData.tsx
│   │
│   └── ui/                       # Generic primitives (shadcn-style)
│       ├── toast.tsx
│       ├── card-stack.tsx
│       └── …
│
├── config/
│   └── constants.ts              # COLORS, ROUTES, VIDEOS, APP_LINKS, services[]
│
├── data/
│   └── blogArticles.ts           # Static content / CMS-shaped data
│
├── hooks/
│   ├── use-mobile.tsx
│   ├── useImagePreloader.ts
│   ├── useDesktopHoverAnimations.ts
│   └── …
│
├── lib/
│   ├── metadata.ts               # generateMetadata helpers
│   ├── blog-metadata.ts
│   ├── structured-data.ts
│   └── utils.ts
│
├── public/
│   ├── images/
│   ├── videos/
│   ├── audio/
│   ├── robots.txt
│   └── manifest.json
│
├── next.config.ts
├── tsconfig.json                 # "@/*" → project root
└── package.json

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/84b4c61c-2a73-4c5a-a1c6-09be287cd3b5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
