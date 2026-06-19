# Library Management System

Backend-driven Library Management System built for the internship project requirements in the PDF. It includes authentication, role-based access control, catalog management, member management, borrow and return workflows, overdue tracking, notifications, reports, Swagger documentation, and a Postman collection.

## Tech Stack

- Node.js and Express.js
- MongoDB and Mongoose ODM
- JWT authentication
- bcrypt password hashing
- Role-based access control for librarians and members
- Joi request validation
- Helmet, CORS, rate limiting, and centralized error handling
- Swagger UI and Postman documentation
- Static HTML, CSS, and JavaScript frontend dashboard

## Project Structure

```text
internship project/
  docs/
    architecture.md
    openapi.yaml
    postman_collection.json
  frontend/
    app.js
    index.html
    styles.css
  src/
    config/
    constants/
    controllers/
    middleware/
    models/
    routes/
    utils/
    validators/
    app.js
    seed.js
    server.js
  .env.example
  package.json
  README.md
```

## Setup

1. Install Node.js and MongoDB.
2. Open a terminal in this folder:

```bash
cd "C:\Users\ak960\OneDrive\Desktop\ayush\internship project"
```

3. Install packages:

```bash
npm install
```

4. Create `.env` from `.env.example` and update values if needed:

```bash
copy .env.example .env
```

`LIBRARIAN_INVITE_CODE` is required when registering a new librarian through the API.

5. Seed demo data:

```bash
npm run seed
```

6. Start the server:

```bash
npm run dev
```

The API runs at `http://localhost:5000`.

The frontend dashboard runs at `http://localhost:5000/dashboard`.

## Demo Accounts

After running `npm run seed`:

| Role | Email | Password |
| --- | --- | --- |
| Librarian | librarian@example.com | Password@123 |
| Member | member@example.com | Password@123 |
| Member with overdue record | late@example.com | Password@123 |

## Main API Modules

| Module | Endpoints |
| --- | --- |
| Auth | `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `PATCH /api/v1/auth/me` |
| Categories | `GET /api/v1/categories`, `POST /api/v1/categories`, `PATCH /api/v1/categories/:id`, `DELETE /api/v1/categories/:id` |
| Books | `GET /api/v1/books`, `POST /api/v1/books`, `GET /api/v1/books/:id`, `PATCH /api/v1/books/:id`, `DELETE /api/v1/books/:id` |
| Members | `GET /api/v1/members`, `GET /api/v1/members/:id`, `PATCH /api/v1/members/:id/status`, `GET /api/v1/members/me/history` |
| Borrowing | `POST /api/v1/borrows/:bookId`, `PATCH /api/v1/borrows/return/:recordId`, `GET /api/v1/borrows/history`, `GET /api/v1/borrows/overdue`, `GET /api/v1/borrows/availability/:bookId` |
| Notifications | `GET /api/v1/notifications`, `PATCH /api/v1/notifications/:id/read` |
| Reports | `GET /api/v1/reports/most-borrowed-books`, `GET /api/v1/reports/active-members`, `GET /api/v1/reports/overdue-records`, `GET /api/v1/reports/inventory-status` |

## Documentation

- Frontend dashboard: `http://localhost:5000/dashboard`
- Swagger UI: `http://localhost:5000/api-docs`
- OpenAPI file: `docs/openapi.yaml`
- Postman collection: `docs/postman_collection.json`
- Architecture diagram: `docs/architecture.md`

## Submission Checklist

- Authentication and authorization module
- Book catalog management APIs
- Member management APIs
- MongoDB database schema through Mongoose models
- Borrow and return module
- Overdue tracking and fine calculation
- Notification module
- Reporting and analytics APIs
- Frontend dashboard for librarian and member workflows
- Swagger and Postman documentation
- Architecture diagram
