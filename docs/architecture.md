# Architecture Diagram

```mermaid
flowchart LR
  Client["Frontend / Postman Client"] --> API["Express REST API"]
  API --> Auth["JWT Auth + RBAC Middleware"]
  API --> Validation["Joi Validation"]
  API --> Controllers["Controllers"]
  Controllers --> Models["Mongoose Models"]
  Models --> MongoDB[("MongoDB")]
  Controllers --> Notifications["Notification Utility"]
  Controllers --> Reports["Aggregation Reports"]
```

## Collections

```mermaid
erDiagram
  USERS ||--o{ BORROW_RECORDS : borrows
  USERS ||--o{ NOTIFICATIONS : receives
  BOOKS ||--o{ BORROW_RECORDS : tracked_in
  CATEGORIES ||--o{ BOOKS : groups

  USERS {
    ObjectId _id
    string name
    string email
    string password
    string role
    string membershipStatus
    number borrowLimit
  }

  BOOKS {
    ObjectId _id
    string title
    string isbn
    string author
    ObjectId category
    number totalCopies
    number availableCopies
  }

  CATEGORIES {
    ObjectId _id
    string name
    string description
  }

  BORROW_RECORDS {
    ObjectId _id
    ObjectId member
    ObjectId book
    ObjectId issuedBy
    Date dueDate
    Date returnDate
    string status
    number fine
  }

  NOTIFICATIONS {
    ObjectId _id
    ObjectId user
    string type
    string title
    string message
    boolean isRead
  }
```

## Access Control

| Role | Permissions |
| --- | --- |
| Librarian | Manage categories, books, members, borrowing on behalf of members, overdue records, and reports |
| Member | Register/login, update profile, search books, borrow available books, return own books, view own history and notifications |
