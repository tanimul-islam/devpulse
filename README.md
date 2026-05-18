# B7A2

# 🚼 DevPulse – Assignment Requirements Specification

> Internal Tech Issue & Feature Tracker
> 
> 
> *A collaborative platform for software teams to report bugs, suggest features, and coordinate resolutions.*
> 

---

## 🛠️ Technology Stack

| Technology | Note |
| --- | --- |
| Node.js | LTS runtime (24.x or higher) |
| TypeScript | use latest version, dont use beta version |
| Express.js | Modular router architecture |
| PostgreSQL | Relational database, native `pg` driver only |
| Raw SQL | Direct `pool.query()` calls, absolutely no query builders, ORMs, or SQL JOINs |
| bcrypt | Password hashing, salt rounds between 8 and 12 |
| jsonwebtoken | JWT generation & verification (standard tokens) |

---

## 👥 User Roles & Permissions

| Role | Allowed Actions |
| --- | --- |
| **contributor** | • Register and log in<br>• Create new issues (bug or feature request)<br>• View all issues |
| **maintainer** | • All contributor permissions<br>• Update any issue field<br>• Delete any issue<br>• Change issue workflow status independently<br>• Access internal system metrics |

---

## 🔐 Authentication & Authorization System

- **JWT Flow:** Client sends credentials → Server validates & hashes/compares → Server returns signed JWT → Client attaches token to `Authorization: <token>` header → Server verifies signature & expiry before processing.
- **Security Rules:**
    - Passwords are never exposed in responses or logs.
    - Protected endpoints reject requests without a valid JWT.
    - Role verification occurs before privileged operations.

---

## 🗄️ Database Schema Design

### Table 1: `users`

| Field | Requirement (Plain Text) |
| --- | --- |
| `id` | Auto-incrementing unique identifier for each account |
| `name` | Full display name of the team member, must be provided |
| `email` | Valid login address, must be unique across all accounts, must be provided |
| `password` | Encrypted string stored securely, must be provided during registration, never returned in responses |
| `role` | Determines system access level, defaults to `contributor`, must be `contributor` or `maintainer` |
| `created_at` | Timestamp marking when the account was created, automatically generated on insert |
| `updated_at` | Timestamp marking when the account was last updated, automatically refreshed on update |

### Table 2: `issues`

| Field | Requirement (Plain Text) |
| --- | --- |
| `id` | Auto-incrementing unique identifier for each reported item |
| `title` | Short descriptive headline, must be provided, maximum 150 characters |
| `description` | Detailed explanation of the problem or suggestion, must be provided, minimum 20 characters |
| `type` | Categorizes the entry, must be either `bug` or `feature_request` |
| `status` | Current workflow state, defaults to `open`. Status must be one of: `open`, `in_progress`, `resolved` |
| `reporter_id` | References the user who submitted the issue (no foreign key constraint required; validate in application logic) |
| `created_at` | Timestamp marking when the issue was created, automatically generated on insert |
| `updated_at` | Timestamp marking when the issue was last updated, automatically refreshed on update |

---

## 🌐 API Endpoints Specification

### 🔹 Authentication Module

### 1. User Registration

**Access:** Public

**Description:** Register a new user account with contributor or maintainer role

**Endpoint**

`POST /api/v1/auth/signup`

**Request Body**

```json
{
  "name": "John Doe",
  "email": "john.doe@devpulse.com",
  "password": "securePassword123",
  "role": "contributor"
}
```

**Success Response (201 Created)**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@devpulse.com",
    "role": "contributor",
    "created_at": "2026-01-20T09:00:00Z",
    "updated_at": "2026-01-20T09:00:00Z"
  }
}
```

---

### 2. User Login

**Access:** Public

**Description:** Authenticate user and receive JWT token

**Endpoint**

`POST /api/v1/auth/login`

**Request Body**

```json
{
  "email": "john.doe@devpulse.com",
  "password": "securePassword123"
}
```

**Success Response (200 OK)**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john.doe@devpulse.com",
      "role": "contributor",
      "created_at": "2026-01-20T09:00:00Z",
      "updated_at": "2026-01-20T09:00:00Z"
    }
  }
}
```

> 💡 **Hint:** When signing the JWT during login, include the user's `id`, `name`, and `role` in the token payload. These fields will be needed later to identify the requester and enforce permissions.
> 

---

### 🔹 Issues Module

### 3. Create Issue

**Access:** Authenticated users (`contributor`, `maintainer`)

**Description:** Create a new bug report or feature request

**Endpoint**

`POST /api/v1/issues`

**Headers**

```
Authorization: <JWT_TOKEN>
```

**Request Body**

```json
{
  "title": "Database connection timeout under load",
  "description": "Pool exhausts after 50+ concurrent queries, causing 500 errors",
  "type": "bug"
}
```

**Success Response (201 Created)**

```json
{
  "success": true,
  "message": "Issue created successfully",
  "data": {
    "id": 45,
    "title": "Database connection timeout under load",
    "description": "Pool exhausts after 50+ concurrent queries, causing 500 errors",
    "type": "bug",
    "status": "open",
    "reporter_id": 1,
    "created_at": "2026-01-20T10:30:00Z",
    "updated_at": "2026-01-20T10:30:00Z"
  }
}
```

> 💡 **Hint:** The `reporter_id` is extracted from the decoded JWT (`req.user.id`), not from the request body.
> 

---

### 4. Get All Issues

**Access:** Public

**Description:** Retrieve all issues with optional sorting and filtering

**Endpoint**

`GET /api/v1/issues?sort=newest`

**Query Parameters (`let’s take a challenge`)**

| Param | Values | Default |
| --- | --- | --- |
| `sort` | `newest`, `oldest` | `newest` |
| `type` | `bug`, `feature_request` | (none) |
| `status` | `open`, `in_progress`, `resolved` | (none) |

**Success Response (200 OK)**

```json
{
  "success": true,
  "data": [
    {
      "id": 45,
      "title": "Database connection timeout under load",
      "description": "Pool exhausts after 50+ concurrent queries, causing 500 errors",
      "type": "bug",
      "status": "open",
      "reporter": {
        "id": 1,
        "name": "John Doe",
        "role": "contributor"
      },
      "created_at": "2026-01-20T10:30:00Z",
      "updated_at": "2026-01-20T14:45:00Z"
    }
  ]
}
```

> 💡 **Hint:** To include `reporter` details without JOINs, fetch issues first, then fetch reporter data for each issue in a separate query (or batch with `WHERE id IN (...)`).
> 

---

### 5. Get Single Issue

**Access:** Public

**Description:** Retrieve full details of a specific issue

**Endpoint**

`GET /api/v1/issues/:id`

**Success Response (200 OK)**

```json
{
  "success": true,
  "data": {
    "id": 45,
    "title": "Database connection timeout under load",
    "description": "Pool exhausts after 50+ concurrent queries, causing 500 errors",
    "type": "bug",
    "status": "open",
    "reporter": {
      "id": 1,
      "name": "John Doe",
      "role": "contributor"
    },
    "created_at": "2026-01-20T10:30:00Z",
    "updated_at": "2026-01-20T14:45:00Z"
  }
}
```

---

### 6. Update Issue

**Access:** Maintainer (any issue) OR Contributor (own issue, only if status is `open`)

**Description:** Update issue title, description, or type

**Endpoint**

`PATCH /api/v1/issues/:id`

**Headers**

```
Authorization: <JWT_TOKEN>
```

**Request Body**

```json
{
  "title": "Updated: Database pool exhaustion fix needed",
  "description": "Updated description with reproduction steps...",
  "type": "bug"
}
```

**Success Response (200 OK)**

```json
{
  "success": true,
  "message": "Issue updated successfully",
  "data": {
    "id": 45,
    "title": "Updated: Database pool exhaustion fix needed",
    "description": "Updated description with reproduction steps...",
    "type": "bug",
    "status": "in_progress",
    "reporter_id": 1,
    "created_at": "2026-01-20T10:30:00Z",
    "updated_at": "2026-01-20T14:45:00Z"
  }
}
```

---

### 7. Delete Issue

**Access:** Maintainer only

**Description:** Permanently remove an issue from the system

**Endpoint**

`DELETE /api/v1/issues/:id`

**Headers**

```
Authorization: <JWT_TOKEN>
```

**Success Response (200 OK)**

```json
{
  "success": true,
  "message": "Issue deleted successfully"
}
```

---

## 🚨 Common Response Patterns

**Standard Success Response Structure**

```json
{
  "success": true,
  "message": "Operation description",
  "data": "Response data"
}
```

**Standard Error Response Structure**

```json
{
  "success": false,
  "message": "Error description",
  "errors": "Error details"
}
```

**HTTP Status Codes**

*(Tip: Use the [`http-status-codes`](https://www.npmjs.com/package/http-status-codes) package for consistent status code references)*

| Code | Reason Phrase | Usage |
| --- | --- | --- |
| `200` | OK | Successful GET, PATCH, PUT, DELETE |
| `201` | Created | Successful POST (resource created) |
| `204` | No Content | Successful DELETE with no response body |
| `400` | Bad Request | Validation errors, invalid input, duplicate resource |
| `401` | Unauthorized | Missing, expired, or invalid JWT token |
| `403` | Forbidden | Valid token but insufficient role/permissions |
| `404` | Not Found | Requested resource does not exist |
| `409` | Conflict | Business logic conflict (e.g., editing resolved issue) |
| `500` | Internal Server Error | Unexpected server or database error |

---

## 📬 Submission Guidelines

### 1️⃣ Codebase Requirements

**Architecture & Code Quality:**

- Use **modular architecture**: separate `modules/`, `utils/`, `config/`, and `middleware/` directories
- Create **reusable utility functions** for common tasks (response formatting, error handling, SQL queries)
- Follow the **DRY principle**: avoid code duplication; extract shared logic into helpers
- Keep code **clean and readable**: meaningful variable names, consistent formatting, inline comments for complex logic
- Use **TypeScript strictly**: no `any` types, proper interfaces for request/response bodies

**Critical Requirements:**

⚠️ **You must follow the `API Endpoints Specification` exactly**—including endpoint paths, HTTP methods, request body structure, and response format. Deviations will result in **0 marks**.

---

### 2️⃣ Documentation & Deployment Requirements

[**README.md](http://readme.md/) Overview:** Include project name, live URL, features, tech stack, setup steps, API endpoint list, and database schema summary. Keep it clear and professional.

**Deployment Requirements:**

- Deploy backend to **Vercel**, **Render**, or **Railway**
- Use **NeonDB**, **Supabase**, or **ElephantSQL** for PostgreSQL
- Ensure CORS and environment variables are properly configured

---

### 3️⃣ What You Need to Submit

```
GitHub Repo (Public): <https://github.com/yourusername/devpulse>
Live Deployment (Public): <https://devpulse-api.vercel.app>
```

> 💡 Pro Tip: Ensure your GitHub repo has at least 10 meaningful commits showing progressive development. Avoid single-commit submissions.
> 

---

## 🎓 Assignment Deadlines

| Marks | Deadline |
| --- | --- |
| **60 Marks** | May 23, 2026 at 11:59 PM |
| **50 Marks** | May 24, 2026 at 11:59 PM |
| **30 Marks** | After May 24, 2026 at 11:59 PM |

---

## ⚠️ Academic Integrity Policy

- **Plagiarism will not be tolerated.** All submissions must be your original work.
- Any instance of plagiarism will result in **0 Marks** and may trigger disciplinary action.

> 🔍 Submissions may be reviewed via code similarity tools and oral defense if required.
> 

---

**Good luck! 🚀** Build something clean, secure, and well-documented.
