
# 🚼 DevPulse

> Project - Next Level Web Development
> Internal Tech Issue & Feature Tracker
> *A collaborative platform for software teams to report bugs, suggest features, and coordinate resolutions.*
> 

##   [Live URL](https://devpulse-three-eta.vercel.app/)

## 🛠️ Technology Stack

| Technology   | Usage                                        |
| ------------ | -------------------------------------------- |
| Node.js      | Runtime environment                          |
| TypeScript   | Type-safe backend development                |
| Express.js   | Backend framework and routing                |
| PostgreSQL   | Relational database                          |
| Raw SQL      | Direct database queries using `pool.query()` |
| bcrypt       | Password hashing & Salting                   |
| jsonwebtoken | JWT generation & verification                |

---
## ✨Fearures

-   User registration and login
-   JWT-based authentication
-   Role-based authorization
-   Contributor and maintainer user roles
-   Create bug reports and feature requests
-   View all reported issues
-   View details of a single issue
-   Update issue title, description, or type
-   Maintainer-only issue deletion
-   Issue filtering by type and status
-   Issue sorting by newest or oldest
-   Secure password hashing
-   Standard success and error response format

## 👥 User Roles & Permissions

| Role            | Allowed Actions                                                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **contributor** | • Register and log in<br>• Create new issues (bug or feature request)<br>• View all issues<br>• Update own issue field              |
| **maintainer**  | • All contributor permissions<br>• Update any issue field<br>• Delete any issue<br>• Change issue workflow status independently<br> |

---
## ⚙️ Setup Steps
**Clone the Repository**
```bash
git clone https://github.com/tanimul-islam/devpulse.git
cd devpulse
```
**Install Dependencies**
```bash
npm install
```
**Configure Environment Variables**
Create a `.env` file in the root directory and add the required environment variables.
```env
PORT  = your_port
DATABASE_URL  = db_url
ACCESS_SECRET= jwt_secret
REFRESH_SECRET= jwt_secret
```
**Set Up the Database**
Create the required PostgreSQL tables for `users` and `issues`.


## 🌐API Endpoints

**Authentication**

| Method | Endpoint           | Acess  | Description                            |
| ------ | ------------------ | ------ | -------------------------------------- |
| `POST` | `/api/auth/signup` | Public | Register a new user account            |
| `POST` | `/api/auth/login`  | Public | Authenticate user and return JWT token |
**Issues**

| Method   | Endpoint          | Acess                     | Description                                |
| -------- | ----------------- | ------------------------- | ------------------------------------------ |
| `POST`   | `/api/issues`     | Authenticated users       | Create a new bug report or feature request |
| `GET`    | `/api/issues`     | Public                    | Retrieve all issues                        |
| `GET`    | `/api/issues/:id` | Public                    | Retrieve a single issue                    |
| `PATCH`  | `/api/issues/:id` | Maintainer or Issue Owner | Update issue title, description, or type   |
| `DELETE` | `/api/issues/:id` | Maintainer Only           | Delete an issue                            |

---
## 🔎 Query Parameters
The `GET /api/issues` endpoint supports optional query parameters.

| Parameter | Values                           | Default  |
| --------- | -------------------------------- | -------- |
| `sort`    | `newest`,`oldest`                | `newest` |
| `type`    | `bug`,`feature_request`          | None     |
| `status`  | `open`, `in_progress`,`resolved` | None     |

## 🔐 Authentication & Authorization System

- **JWT Flow:** Client sends credentials → Server validates & hashes/compares → Server returns signed JWT → Client attaches token to `Authorization: <token>` header → Server verifies signature & expiry before processing.
- **Security Rules:**
    - Passwords are never exposed in responses or logs.
    - Protected endpoints reject requests without a valid JWT.
    - Role verification occurs before privileged operations.

---

## 🗄️ Database Schema Summary

### `users` Table

| Field        | Description                                                                            |
| ------------ | -------------------------------------------------------------------------------------- |
| `id`         | Auto-incrementing unique user ID                                                       |
| `name`       | Full display name of the user                                                          |
| `email`      | Unique login email address                                                             |
| `password`   | Encrypted password                                                                     |
| `role`       | User role: `contributor` or `maintainer`                                               |
| `created_at` | Timestamp marking when the account was created, automatically generated on insert      |
| `updated_at` | Timestamp marking when the account was last updated, automatically refreshed on update |

### `issues` Table

| Field         | Description                                                                                          |
| ------------- | ---------------------------------------------------------------------------------------------------- |
| `id`          | Auto-incrementing unique issue ID                                                                    |
| `title`       | Short descriptive headline, must be provided, maximum 150 characters                                 |
| `description` | Detailed explanation of the problem or suggestion, must be provided, minimum 20 characters           |
| `type`        | Categorizes the entry, must be either `bug` or `feature_request`                                     |
| `status`      | Current workflow state, defaults to `open`. Status must be one of: `open`, `in_progress`, `resolved` |
| `reporter_id` | ID of the user who submitted the issue                                                               |
| `created_at`  | Timestamp marking when the issue was created, automatically generated on insert                      |
| `updated_at`  | Timestamp marking when the issue was last updated, automatically refreshed on update                 |

---

