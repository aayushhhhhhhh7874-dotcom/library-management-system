# StackShelf - BTech CSE Library Management System

StackShelf is a full-stack library management project for BTech Computer Science and Engineering. It includes a responsive frontend, MongoDB persistence, member registration and sign-in, librarian administration, 1,000 seeded academic books, borrowing and returns, overdue tracking, notifications, analytics, Swagger documentation, and Postman requests.

## Included

- Dedicated Sign in and Create account screens
- JWT authentication and bcrypt password hashing
- MongoDB member profiles with student ID, semester, department, and enrollment year
- Librarian and member role-based access control
- Exactly 1,000 unique BTech CSE books across 25 subject categories and 8 semesters
- Search by title, author, ISBN, publisher, tags, or subject code
- Category, semester, availability, sorting, and pagination controls
- Borrowing, librarian issue desk, returns, due dates, overdue records, and fines
- Borrow, return, and overdue notifications
- Member status and borrow-limit management
- Inventory, popular-book, active-member, and overdue reports
- Docker Compose setup with a persistent MongoDB volume
- No-install local JSON database mode for quick demos
- Swagger/OpenAPI and Postman documentation
- Phase 2 submission checklist, deployment guide, and architecture diagrams

## Phase 2 Submission

- Quick presentation guide: `PROJECT_DEMO_GUIDE.md`
- Java upgrade notes: `docs/java-upgrade.md`
- Submission checklist: `docs/phase-2-submission.md`
- Architecture diagrams: `docs/architecture.md`
- Deployment guide: `docs/deployment.md`
- Swagger/OpenAPI: `docs/openapi.yaml` and `/api-docs`
- Postman collection: `docs/postman_collection.json`

## No-Install Local Demo

Use this when Node is available but npm, MongoDB, or Docker are not installed yet.

```bash
cd "C:\Users\ak960\OneDrive\Desktop\ayush\internship project"
start-local-demo.bat
```

Open `http://localhost:5000`. The frontend and API run from the same port, and data is saved in `data/local-library-db.json`.

Demo accounts:

| Role | Email | Password |
| --- | --- | --- |
| Librarian | `aayush.kr0804@gmail.com` | `Password@123` |
| Student member | `member@example.com` | `Password@123` |
| Member with overdue book | `late@example.com` | `Password@123` |

## Advanced Java Demo

Use this version when you want to show that the project also has a Java backend. It uses the installed JDK only, so Maven and external downloads are not required.

```bash
cd "C:\Users\ak960\OneDrive\Desktop\ayush\internship project"
start-java-demo.bat
```

Open `http://127.0.0.1:8080`. The Java server serves the professional frontend and implements the same main API modules with an in-memory CSE library dataset.

Java code:

- `java-backend/StackShelfJavaServer.java`
- `java-backend/README.md`
- `start-java-demo.bat`

## Recommended Start With Docker

Requirements: Docker Desktop.

```bash
cd "C:\Users\ak960\OneDrive\Desktop\ayush\internship project"
docker compose up -d --build
docker compose --profile tools run --rm seed
```

Open:

- Frontend: `http://localhost:5000/dashboard`
- API health: `http://localhost:5000/health`
- Swagger: `http://localhost:5000/api-docs`

The MongoDB data is stored in the `stackshelf_mongodb_data` Docker volume and remains available after containers restart.

## Local Start

Requirements: Node.js 20+, npm, and MongoDB 7+.

```bash
cd "C:\Users\ak960\OneDrive\Desktop\ayush\internship project"
copy .env.example .env
npm install
npm run seed
npm run dev
```

Important: `npm run seed` clears the configured database and recreates the full demonstration dataset.

## Demo Accounts

| Role | Email | Password |
| --- | --- | --- |
| Librarian | `aayush.kr0804@gmail.com` | `Password@123` |
| Student member | `member@example.com` | `Password@123` |
| Member with overdue book | `late@example.com` | `Password@123` |

New student accounts can be created from the frontend. The registration request is validated by the API, the password is hashed, and the profile is stored in the MongoDB `users` collection before the new user is signed in.

## 1,000-Book Catalog

The catalog generator is located at `src/data/cseBookCatalog.js`. It creates 40 unique academic titles for each of 25 BTech CSE subjects. Every record includes:

- Unique title and valid unique ISBN-13
- Author, publisher, publication year, and edition
- Course, department, semester, and subject code
- Category, tags, shelf location, description, and copy counts

Verify it without MongoDB:

```bash
npm run verify:catalog
```

## Main Structure

```text
frontend/                 Authentication and dashboard UI
src/data/                 1,000-book catalog generator
src/models/               MongoDB/Mongoose schemas
src/controllers/          Business logic
src/routes/               REST API routes
src/validators/           Joi request validation
src/seed.js               Database seed workflow
docs/openapi.yaml         Swagger specification
docs/postman_collection.json
Dockerfile
docker-compose.yml
```

## Core API

| Module | Routes |
| --- | --- |
| Authentication | `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET/PATCH /api/v1/auth/me` |
| Catalog | `GET/POST /api/v1/books`, `GET/PATCH/DELETE /api/v1/books/:id` |
| Categories | `GET/POST /api/v1/categories`, `PATCH/DELETE /api/v1/categories/:id` |
| Members | `GET /api/v1/members`, `GET /api/v1/members/:id`, `PATCH /api/v1/members/:id/status` |
| Borrowing | `POST /api/v1/borrows/:bookId`, `PATCH /api/v1/borrows/return/:recordId`, `GET /api/v1/borrows/history` |
| Notifications | `GET /api/v1/notifications`, `PATCH /api/v1/notifications/:id/read` |
| Reports | `/api/v1/reports/most-borrowed-books`, `/active-members`, `/overdue-records`, `/inventory-status` |

## Verification

```bash
npm run check
```

This checks every backend/frontend JavaScript file and verifies all 1,000 catalog records are unique and valid.
