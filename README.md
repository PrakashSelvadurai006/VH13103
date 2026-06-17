# Campus Notification System - Placement Portal

A production-grade, highly scalable real-time Campus Notification System built for university placement portals. The system supports live feeds, bulk push broadcasts (scale: 50,000+ students), O(1) Redis caching with query counters, and a priority-heap Inbox ranking.

---

## Technical Stack

*   **Frontend**: React, TypeScript, Vite, React Query (TanStack), React Router, Tailwind CSS, Lucide Icons, Socket.IO Client.
*   **Backend**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, Redis, BullMQ, Socket.IO.
*   **Testing**: Jest, Supertest, TS-Jest (Unit & Integration).
*   **Infrastructure**: Docker, Nginx (frontend server proxy).

---

## Directory Folder Structure

```
campus-notification-system/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma           # DB models & optimized composite indexes
│   │   └── seed.ts                 # Mock student profile generator
│   ├── src/
│   │   ├── controllers/            # Controller layer
│   │   ├── middleware/             # Custom file/console logs, rate limiting
│   │   ├── queues/                 # BullMQ queue creators
│   │   ├── repositories/           # Repositories (avoid wildcard SELECT *)
│   │   ├── routes/                 # Express API routing path maps
│   │   ├── services/               # Socket.IO, Email/Push, caching service logic
│   │   ├── utils/                  # Priority Queue Min-Heap, Redis connection
│   │   ├── workers/                # BullMQ asynchronous batch worker consumers
│   │   └── server.ts               # Server bootstrap entry point
│   ├── tests/
│   │   ├── integration/            # Supertest integration API tests
│   │   └── unit/                   # Min-Heap algorithmic sorting tests
│   ├── Dockerfile
│   ├── jest.config.js
│   ├── nodemon.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/             # Reusable UI elements (cards, filters, pagination)
│   │   ├── hooks/                  # TanStack React Query + Socket hooks
│   │   ├── pages/                  # NotificationsPage, PriorityPage
│   │   ├── services/               # API call client, Socket.IO connection client
│   │   ├── types/                  # Shared TypeScript interfaces
│   │   ├── App.tsx                 # Main layout routing and student state switcher
│   │   ├── index.css               # Tailwind directives and cosmic UI styling
│   │   └── main.tsx                # Client renderer bootstrap
│   ├── Dockerfile
│   ├── index.html
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── tsconfig.json
├── docker-compose.yml              # PostgreSQL, Redis orchestrator
└── package.json                    # Root script manager
```

---

## Stage-by-Stage Architecture and Explanations

### Stage 1: REST APIs & Real-time WebSockets
*   All notifications are delivered instantly to active student socket connections via dedicated client room subscriptions (`student:${id}`).
*   API responses conform to a strict JSON wrapper: `{ success: boolean, data: any, meta?: any }`.
*   Validation sanitizers process request payloads using `express-validator` to guarantee data type safety.

### Stage 2: Database Schema & Repository Pattern
*   PostgreSQL serves as the primary relational database.
*   Database calls are isolated inside the Repository layer to enforce column projection (`select` fields) instead of fetching redundant data (`SELECT *`).

### Stage 3: Query Optimization & Raw SQL Plan
*   To discover students who have received `Placement` category notifications, we use the following optimized raw SQL query:

```sql
SELECT DISTINCT s.id, s.name, s.email
FROM students s
INNER JOIN notifications n ON s.id = n.student_id
WHERE n.type = 'Placement'::"NotificationType"
```

#### Query Execution Plan Analysis
When PostgreSQL evaluates this query:
1.  **Index Scan**: The query analyzer performs an index scan on `notifications_notification_type_idx` matching `type = 'Placement'`. Because the column has a B-Tree index, finding the matching rows takes $O(\log N)$ time.
2.  **Bitmap Index Scan / Heap Scan**: Matches are collected and matched against the `notifications_student_id_idx` or join columns to resolve the primary key relationship.
3.  **Hash Join**: A hash table is built in memory for the matching `notifications` student ID keys. It is scanned against the `students` table's clustered index (`id`), yielding student records matching the filter.
4.  **HashAggregate**: To evaluate `DISTINCT`, a hash aggregate table of `(s.id, s.name, s.email)` groups is evaluated in memory, eliminating redundant student entries.

### Stage 4: Redis Caching & Cache Invalidation
The application implements an $O(1)$ version-increment cache layout:
*   A query for student $S$ checks the version key: `notifications:student:S:version`.
*   The cached query result key format includes this version token: `notifications:student:S:version:V:query:PARAMS_HASH`.
*   When a new notification is generated, read, or deleted for student $S$, the version is incremented: `INCR notifications:student:S:version`.
*   This instantly invalidates all cached query variations for student $S$ in $O(1)$, avoiding database scans or keys lists searches.

```
Request GET /api/notifications
  │
  ├─► Check student version (e.g. V=1)
  ├─► Key lookup: notifications:student:S:version:1:query:HASH
  │
  ├──► [HIT]  Return JSON from Redis Cache
  └──► [MISS] Query PostgreSQL ──► Cache result in Redis (TTL 5m)
```

### Stage 5: Bulk Notification Queue Architecture
HR dispatches are batched into sub-groups (5000 recipients each) and processed asynchronously using BullMQ workers.

```
HR Admin User 
  │
  ▼
POST /api/notifications/bulk 
  │
  ├──► Fetch targeted student IDs
  ├──► Split recipients list into chunks of 5000
  ├──► Enqueue jobs to BullMQ
  │
  ▼
[ BullMQ Redis Queue ] 
  │
  ▼
[ Workers (Concurrency: 5) ] 
  │
  ├─► Bulk Insert: INSERT INTO notifications (Prisma createMany)
  ├─► Invalidate student Redis caches (INCR version)
  ├─► Real-time socket delivery (Socket.IO emit)
  ├─► Email Simulation (logs to console with 5ms latency)
  └─► Push Notification Simulation (logs to console with 5ms latency)
```

*   **Retry strategy**: BullMQ automatically retries failed jobs up to 3 times using an exponential backoff formula (`delay * 2^(attempt)` starting at 1000ms).
*   **Dead Letter Queue (DLQ)**: Jobs exceeding 3 failures are moved to the `failed` queue and retained in Redis for administrative review and audit.

### Stage 6: Priority Inbox & Min Heap
Instead of fetching all notifications and running a full sort $O(N \log N)$ on the database or backend, we maintain the Top 10 notifications using a **Min Heap**.
*   **Formula**: `Priority Score = Category Base + Unread Bonus`
    *   `Placement` = 20 pts, `Result` = 10 pts, `Event` = 5 pts.
    *   `Unread` = +10 pts.
*   **Min Heap Algorithm**:
    *   Initialize a Min-Heap of size $k = 10$.
    *   Iterate through the notification list. For each element, insert it if the heap size is $< 10$.
    *   If size is $10$ and the new element's score is higher than the root of the Min Heap (which is the current minimum of our top 10), we extract the minimum root element and insert the new element.
    *   **Tie-breaking**: If priority scores are identical, the newer notification has higher precedence (the older notification is deemed "smaller" and is placed at the root of the Min Heap to be evicted).
    *   **Complexity**: $O(N \log 10) = O(N)$ time complexity, requiring only $O(k) = O(1)$ additional memory space. This is highly optimal.

---

## Setup & Running Guide

### Prerequisites
Make sure you have [Docker](https://www.docker.com/) and [Node.js](https://nodejs.org/) installed.

### Step 1: Start PostgreSQL and Redis
From the project root workspace, spin up the database and caching containers in the background:
```bash
npm run docker:up
```

### Step 2: Set up the Backend
1.  Navigate to the `/backend` directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run Prisma database migrations to create the database schema:
    ```bash
    npm run prisma:migrate
    ```
    *(When prompted for a migration name, you can write `init`).*
4.  Seed the database with mock student records:
    ```bash
    npm run prisma:seed
    ```
5.  Start the backend development server:
    ```bash
    npm run dev
    ```
    The backend server will run at `http://localhost:5000`.

### Step 3: Run Backend Tests
You can verify the entire backend suite (including Min-Heap algorithms and REST API routes validation) by running:
```bash
npm run test
```

### Step 4: Set up the Frontend
1.  Open a new terminal session and navigate to the `/frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the frontend development server:
    ```bash
    npm run dev
    ```
    The Vite application will start, typically at `http://localhost:5173`. Open this URL in your browser to interact with the system.

---

## Git Commit Milestones

Here are the recommended Git milestones to commit your progress stage by stage:

1.  `milestone/setup`: Root docker-compose, TS configs, package dependency definitions, and monorepo structure.
2.  `milestone/stage-1-2-base`: Prisma schemas, migration creation, custom file/console request logging middleware, repository layer, and Socket.IO real-time notification setup.
3.  `milestone/stage-3-optimization`: Composite database indexes, cursor pagination support, and raw SQL queries for placement student listings.
4.  `milestone/stage-4-caching`: Version-increment $O(1)$ Redis caching utilities and API request limiters.
5.  `milestone/stage-5-bulk`: BullMQ queues, asynchronous worker batch consumers, and mock email/push notification transmission pipelines.
6.  `milestone/stage-6-heap`: Priority Inbox Min-Heap algorithms (`priorityInbox.ts`) and complete Jest unit test suites.
7.  `milestone/stage-7-frontend`: Vite React components, React Query hooks, Socket.IO client connectors, and dashboard UI panels.
