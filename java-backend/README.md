# StackShelf Java Backend

This folder contains the Java version of the StackShelf backend. It is designed for a simple internship project demo because it runs with the installed JDK only and does not require Maven, Spring Boot, npm, MongoDB, or Docker.

## Run

From the main project folder, double-click:

```text
start-java-demo.bat
```

Or run manually:

```bash
cd "C:\Users\ak960\OneDrive\Desktop\ayush\internship project\java-backend"
javac -d build *.java
java -cp build StackShelfJavaServer
```

Open:

```text
http://127.0.0.1:8080
```

## Demo Login

| Role | Email | Password |
| --- | --- | --- |
| Librarian | `aayush.kr0804@gmail.com` | `Password@123` |
| Student member | `member@example.com` | `Password@123` |
| Overdue member | `late@example.com` | `Password@123` |

## What The Java Backend Does

- Serves the professional frontend from `frontend/`
- Provides authentication endpoints
- Creates 1,000 BTech CSE catalog books in memory
- Supports catalog search, filters, sorting, and pagination
- Supports borrowing, issuing, returns, overdue tracking, and notifications
- Supports member management for librarians
- Supports inventory, most-borrowed, active-member, and overdue reports

## Java File Structure

| File Area | Responsibility |
| --- | --- |
| `StackShelfJavaServer.java` | Main application startup |
| `StackShelfRouter.java` | HTTP route mapping |
| `*Controller.java` | API modules for auth, catalog, borrowing, notifications, members, reports, and frontend files |
| `LibraryDataStore.java` | In-memory data repository |
| `DemoDataSeeder.java` | Demo users, categories, books, borrows, and notifications |
| `SecurityService.java`, `BorrowService.java` | Authentication and borrowing business logic |
| `JsonUtil.java`, `JsonViews.java`, `RequestUtil.java`, `HttpResponses.java` | JSON, request, and response helpers |
| `Book.java`, `User.java`, `Category.java`, `BorrowRecord.java`, `Notification.java`, `Subject.java` | Domain models |

## Main API Modules

| Module | Endpoints |
| --- | --- |
| Health | `GET /health` |
| Authentication | `POST /api/v1/auth/login`, `POST /api/v1/auth/register`, `GET/PATCH /api/v1/auth/me` |
| Categories | `GET /api/v1/categories` |
| Catalog | `GET/POST /api/v1/books`, `GET/DELETE /api/v1/books/:id` |
| Borrowing | `POST /api/v1/borrows/:bookId`, `PATCH /api/v1/borrows/return/:recordId`, `GET /api/v1/borrows/history` |
| Notifications | `GET /api/v1/notifications`, `PATCH /api/v1/notifications/:id/read` |
| Members | `GET /api/v1/members`, `PATCH /api/v1/members/:id/status` |
| Reports | `GET /api/v1/reports/inventory-status`, `most-borrowed-books`, `active-members`, `overdue-records` |

## Presentation Line

You can say:

```text
I upgraded the project with a Java backend demo using the JDK HTTP server. It exposes REST-style APIs for authentication, catalog, borrowing, notifications, members, and reports, and serves the same professional frontend dashboard.
```
