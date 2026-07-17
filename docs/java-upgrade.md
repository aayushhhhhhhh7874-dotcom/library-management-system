# Java Upgrade Notes

## Purpose

The original StackShelf project uses Node.js, Express, MongoDB, and a browser frontend. The advanced demo adds a Java backend so the project can be presented as a Java-based library management system while keeping the existing frontend experience.

## Java Backend Design

The Java backend is implemented in:

```text
java-backend/StackShelfJavaServer.java
```

It uses the built-in JDK HTTP server:

```text
com.sun.net.httpserver.HttpServer
```

This keeps the demo easy to run on a lab computer because it does not require Maven, external dependencies, or an internet connection.

## Request Flow

```text
Browser frontend
  -> Java HTTP server
  -> Route handler
  -> In-memory library data
  -> JSON response
```

## Data Model

The Java demo includes in-memory models for:

- User
- Category
- Book
- BorrowRecord
- Notification

The seed data creates:

- 25 BTech CSE subject categories
- 1,000 academic catalog books
- Librarian and student demo accounts
- Active and overdue borrow records
- Borrow and overdue notifications

## Why This Is Advanced

- The same frontend can run with either the Node backend or Java backend.
- The Java backend exposes REST-style APIs.
- The dashboard uses live API data for operational metrics.
- The librarian role can manage catalog books and members.
- Reports calculate inventory, borrowing, active-member, and overdue data.

## Limitations

The Java demo stores data in memory. This is good for presentation because it resets cleanly each time the server starts. For production, this Java backend could be upgraded to Spring Boot with MySQL, PostgreSQL, or MongoDB persistence.
