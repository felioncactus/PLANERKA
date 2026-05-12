# PLANERKA Postman Tests

This folder contains a Postman collection for manually verifying the PLANERKA backend API.
It is intended for open source users, reviewers, and capstone evaluators who want to run the
same API, security, and error handling checks against their own environment.

## Files

```text
Tests/
`-- postman/
    `-- planerka-api-security-testing.postman_collection.json
```

## What The Collection Covers

The collection is organized into three folders:

| Folder | Purpose |
|---|---|
| `API Testing` | Confirms valid backend flows work: auth, courses, tasks, activities, friends, chat, and stats. |
| `Security Testing` | Confirms protected routes reject missing/invalid tokens and users cannot access another user's private data. |
| `Error Handling Testing` | Confirms invalid input is rejected safely with validation errors. |

## Before You Run It

Start the backend and database first. For local development, follow the main installation guide,
run migrations, then start the server.

Typical local backend URL:

```text
http://localhost:5000
```

If your server runs on another port or host, use that instead.

The collection does not require the original PLANERKA Render deployment. Set `base_url` to your own backend.

Examples:

```text
http://localhost:5000
https://your-own-planerka-api.example.com
```

## Import Into Postman

1. Open Postman.
2. Click **Import**.
3. Select `Tests/postman/planerka-api-security-testing.postman_collection.json`.
4. Open the imported collection.
5. Go to the collection **Variables** tab.
6. Set `base_url` to your backend host, for example:

```text
http://localhost:5000
```

Do not include `/api` in `base_url`. The requests already include `/api` where needed.

## Collection Variables

The collection uses these variables:

| Variable | Description |
|---|---|
| `base_url` | Backend host, such as `http://localhost:5000`. |
| `token_a` | JWT token for Test User A. |
| `token_b` | JWT token for Test User B. |
| `token_c` | JWT token for Test User C, used for some security cases. |
| `user_a_id` | User A database ID returned by register/login. |
| `user_b_id` | User B database ID returned by register/login. |
| `user_c_id` | User C database ID returned by register/login. |
| `course_id` | Course ID created during API testing. |
| `task_id` | Task ID created during API testing. |
| `activity_id` | Activity ID created during API testing. |
| `chat_id` | Direct chat ID created during API testing. |
| `message_id` | Chat message ID created during API testing. |
| `self_chat_id` | User A private self-chat ID used for chat security checks. |
| `user_a_email` | Test email for User A. |
| `user_b_email` | Test email for User B. |
| `user_c_email` | Test email for User C. |
| `weak_user_email` | Test email used for weak password validation. |

If you rerun the collection on the same database, change the test email variables first.
Otherwise registration may fail because the users already exist.

Suggested format:

```text
testusera20260512@example.com
testuserb20260512@example.com
testuserc20260512@example.com
weakpass20260512@example.com
```

## Recommended Manual Run Order

Run the requests from top to bottom. Some later requests depend on IDs or tokens returned by earlier requests.

### 1. API Testing

Run these first:

```text
API-01 Health Check
API-02 Register User A
API-03 Register User B
API-03 Register User C
API-04 Login User A
API-04-2 Login User B
API-05 Create Course
API-06 Get Courses
API-07 Create Task
API-08 Get Tasks
API-09 Update Task Status
API-10 Create Activity
API-11 Get Activities
API-12 Update Activity
API-13 Send Friend Request
API-14 Accept Friend Request
API-15 Open Direct Chat
API-16 Send Chat Message
API-17 Get Chat Messages
API-18 Get Statistics
```

After a successful response, copy returned values into collection variables when needed:

| Request | Copy From Response | Save To Variable |
|---|---|---|
| Register/Login User A | `token` | `token_a` |
| Register/Login User A | `user.id` | `user_a_id` |
| Register/Login User B | `token` | `token_b` |
| Register/Login User B | `user.id` | `user_b_id` |
| Register User C | `token` | `token_c` |
| Register User C | `user.id` | `user_c_id` |
| Create Course | `course.id` | `course_id` |
| Create Task | `task.id` | `task_id` |
| Create Activity | `activity.id` | `activity_id` |
| Open Direct Chat | `chat.id` | `chat_id` |
| Send Chat Message | `message.id` | `message_id` |

### 2. Security Testing

Run these after the API setup requests above:

```text
SEC-01 Protected Route Without Token
SEC-02 Invalid Token
SEC-03 Wrong Password Login
SEC-04 User B Cannot Access User A Task
SEC-05 User B Cannot Access User A Activity
SEC-06 Direct Chat Cannot Be Opened Without Friendship
SEC-07 User B Cannot Access Private Self Chat of User A
SEC-08 User B Cannot Delete User A Message
```

For User B security requests, set Authorization to use `{{token_b}}`.
For invalid token testing, use a fake token such as:

```text
fake-token-123
```

Expected security results are usually:

```text
401 Unauthorized
403 Forbidden
404 Not Found
```

These are passing outcomes when the request is intentionally unauthorized.

### 3. Error Handling Testing

Run these with normal authentication where required:

```text
ERR-01 Empty Login Fields
ERR-02 Invalid Email Format
ERR-03 Weak Registration Password
ERR-04 Create Course Without Name
ERR-05 Invalid Course Date Range
ERR-06 Create Task Without Title
ERR-07 Invalid Task Status
ERR-08 Invalid Course ID for Task
ERR-09 Activity End Time Before Start Time
ERR-10 Empty Chat Message
```

Expected results are usually:

```text
400 Bad Request
```

This means validation is working correctly.

## Password Hash Verification

Password hashing is not verified through Postman. Check it directly in PostgreSQL:

```sql
SELECT email, password_hash
FROM users
WHERE email = 'testusera2026@example.com';
```

The value in `password_hash` should be a bcrypt hash, not the original password.
Do not commit database credentials, JWT tokens, or screenshots containing secrets.

## Notes For Contributors

- Use your own local or deployed backend in `base_url`.
- Do not commit real tokens, database URLs, database passwords, or production user data.
- If tests are rerun against the same database, change the test email variables first.
- The collection is primarily a reproducible manual testing artifact. It can be extended later with Postman test scripts or Newman-based automation.
