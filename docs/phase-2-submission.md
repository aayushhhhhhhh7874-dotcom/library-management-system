# Phase 2 Submission

## Project Details

| Field | Value |
| --- | --- |
| Title | Borrowing System, Overdue Tracking & Reporting Module |
| Date | 29 May 2026 |
| Duration | 360 hours |
| Project | StackShelf - BTech CSE Library Management System |
| Repository | `https://github.com/aayushhhhhhhh7874-dotcom/library-management-system.git` |

## Deliverable Checklist

| Requirement | Status | Implementation |
| --- | --- | --- |
| Complete Borrow & Return Module | Complete | `POST /api/v1/borrows/:bookId`, `PATCH /api/v1/borrows/return/:recordId`, borrow limits, copy-count updates, member/librarian flows |
| Overdue Tracking System | Complete | Due-date tracking, overdue status marking, fine calculation, `GET /api/v1/borrows/overdue`, overdue reports |
| Notification Module | Complete | Borrow, return, welcome, and overdue notifications with unread/read state |
| Reporting & Analytics APIs | Complete | Inventory status, most borrowed books, active members, overdue records |
| Live Deployed Backend | Deployment-ready | Dockerfile, Docker Compose, `render.yaml`, health check, deployment guide |
| Swagger/Postman Documentation | Complete | Swagger at `/api-docs`, OpenAPI file, Postman collection |
| Architecture Diagram | Complete | `docs/architecture.md` Mermaid diagrams |
| Final GitHub Repository | Ready | Git remote configured; commit and push final project changes before submission |

## Core Endpoints

| Module | Endpoint |
| --- | --- |
| Borrow book | `POST /api/v1/borrows/:bookId` |
| Return book | `PATCH /api/v1/borrows/return/:recordId` |
| Borrow history | `GET /api/v1/borrows/history` |
| Overdue list | `GET /api/v1/borrows/overdue` |
| Availability | `GET /api/v1/borrows/availability/:bookId` |
| Notifications | `GET /api/v1/notifications`, `PATCH /api/v1/notifications/:id/read` |
| Reports | `GET /api/v1/reports/inventory-status`, `GET /api/v1/reports/most-borrowed-books`, `GET /api/v1/reports/active-members`, `GET /api/v1/reports/overdue-records` |

## Verification

```bash
npm run check
```

For machines without npm or MongoDB installed, run:

```bash
start-local-demo.bat
```

Then open:

```text
http://localhost:5000
```

Demo accounts:

| Role | Email | Password |
| --- | --- | --- |
| Librarian | `aayush.kr0804@gmail.com` | `Password@123` |
| Student member | `member@example.com` | `Password@123` |
| Overdue member | `late@example.com` | `Password@123` |
