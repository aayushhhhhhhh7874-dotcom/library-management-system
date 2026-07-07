# Deployment Guide

This project is ready for a hosted backend deployment on Render, Railway, or any Node.js service that supports environment variables.

## Required Environment Variables

| Variable | Example | Purpose |
| --- | --- | --- |
| `NODE_ENV` | `production` | Enables production mode |
| `PORT` | `5000` | HTTP port used by the service |
| `MONGODB_URI` | `mongodb+srv://...` | MongoDB Atlas or hosted MongoDB connection |
| `JWT_SECRET` | long random string | JWT signing secret |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `LIBRARIAN_INVITE_CODE` | private invite code | Allows librarian account creation |
| `BORROW_DAYS` | `14` | Default due-date window |
| `FINE_PER_DAY` | `5` | Fine amount per overdue day |
| `CORS_ORIGIN` | deployed frontend URL or `*` | Allowed browser origin |

## Render Blueprint

`render.yaml` contains a web-service blueprint:

```bash
buildCommand: npm install
startCommand: npm start
healthCheckPath: /health
```

After creating the service, set `MONGODB_URI` and `LIBRARIAN_INVITE_CODE`, then deploy from the GitHub repository.

## Seed Production Data

Run the seed command once against the deployed database:

```bash
npm run seed
```

The seed workflow creates categories, 1,000 BTech CSE books, demo users, borrow records, overdue data, and notifications.

## Verification URLs

Replace `<backend-url>` with the deployed service URL.

```text
<backend-url>/health
<backend-url>/api-docs
<backend-url>/api/v1/books?limit=1
```

Expected health response:

```json
{
  "status": "success",
  "database": "connected"
}
```
