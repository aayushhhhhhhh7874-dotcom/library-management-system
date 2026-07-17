# StackShelf Project Demo Guide

## Project Title

StackShelf - Advanced BTech CSE Library Management System

## Technology Stack

- Java backend demo using JDK HTTP server
- JavaScript, HTML, and CSS frontend
- Node.js and Express backend for the original full-stack version
- MongoDB support in the original backend
- Local in-memory or JSON demo data for easy presentation

## Main Files To Show

- Java backend: `java-backend/StackShelfJavaServer.java`
- Java backend explanation: `java-backend/README.md`
- Java upgrade documentation: `docs/java-upgrade.md`
- Professional frontend page: `frontend/index.html`
- Frontend logic: `frontend/app.js`
- Frontend design: `frontend/styles.css`
- Original Node backend: `src/server.js` and `src/app.js`

## How To Run The Java Version

Double-click:

```text
start-java-demo.bat
```

Then open:

```text
http://127.0.0.1:8080
```

Demo login:

```text
aayush.kr0804@gmail.com
Password@123
```

## How To Explain It

This is an advanced library management system for BTech CSE students. It includes authentication, role-based access for librarian and student members, a 1,000-book academic catalog, search and filters, borrowing, returns, overdue tracking, notifications, member management, and reports.

The upgraded version adds a Java backend demo and a more professional dashboard-style frontend with live operational metrics for inventory readiness, borrowing pressure, and academic coverage.

Short answer if someone asks about technology:

```text
This project uses Java for the upgraded backend demo, JavaScript for frontend behavior, HTML and CSS for the interface, and the original version also supports Node.js, Express, and MongoDB.
```

Short answer if someone asks why Java was added:

```text
I added a Java backend so the project can be presented as an advanced Java-based library management system. It provides REST-style APIs and serves the same professional frontend dashboard.
```

## Best Demo Flow

1. Open the project folder in VS Code.
2. Show `java-backend/StackShelfJavaServer.java` to explain the Java backend.
3. Run `start-java-demo.bat`.
4. Open `http://127.0.0.1:8080`.
5. Login as librarian.
6. Show Overview, Catalog, Members, Notifications, and Reports.
