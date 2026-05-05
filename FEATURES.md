# Features

This file documents implemented features found in the current project source code. Add screenshots in the indicated placeholders when preparing the final capstone submission.

## Landing, Registration, and Login

[Put screenshot here]

- Public landing page at `/`.
- User registration page at `/register`.
- User login page at `/login`.
- JWT-based authenticated session handling.
- Password validation rules on the frontend and backend.
- Authentication rate limiting on register and login routes.
- Protected application pages that redirect unauthenticated users.
- User session restoration through `/api/auth/me`.

## Dashboard

[Put screenshot here]

- Main authenticated dashboard at `/dashboard`.
- Summary cards for task and planning information.
- Course overview and course shortcuts.
- Upcoming task and schedule information.
- Calendar-style schedule panel.
- Quick actions for creating courses, opening tasks, and planning study work.
- Mobile dashboard panels for compact navigation between dashboard content and schedule content.

## Courses

[Put screenshot here]

- Course list page at `/courses`.
- Course creation page at `/courses/new`.
- Course detail page at `/courses/:id`.
- Course create, read, update, and delete operations through protected API routes.
- Course fields for name, color, description, meeting day, start time, end time, start date, end date, midterm date, and final date.
- Course image and banner upload support.
- Highlighted course display and course cards.
- Course deletion with confirmation.
- Course tasks and course notes accessible from the course detail page.
- Course schedule and exam dates are included in calendar events.

## Tasks

[Put screenshot here]

- Task list page at `/tasks`.
- Task detail page at `/tasks/:id`.
- Task creation, editing, status changes, and deletion.
- Task statuses including `todo`, `doing`, and `done`.
- Task filtering by status and course.
- Task fields for title, description, due date, course, estimated minutes, priority, and splittable planning.
- Task attachment upload, listing, and deletion.
- Direct task links from the task list.
- Task cleanup behavior that removes stale planned calendar blocks when tasks are completed or deleted.

## Task Planning

[Put screenshot here]

- Task planner modal used from both the task page and course detail page.
- Suggested time windows based on calendar availability.
- Study window controls.
- Calendar heatmap-style availability display.
- Manual selection of a suggested study block.
- AI task duration estimation when OpenAI is configured.
- AI task planning endpoint for arranging tasks into one or more blocks.
- Planned task blocks are stored as calendar blocks and appear in the daily calendar.

## Activities

[Put screenshot here]

- Activities page at `/activities`.
- Create fixed personal activities with title, description, location, start time, and end time.
- Manual activity scheduling.
- Planner-based activity scheduling using the same availability suggestion flow used by tasks.
- AI activity planning when OpenAI is configured.
- Activity listing, refresh, quick time shifting, and deletion.
- Activities are stored as calendar blocks and appear in the daily calendar.

## Daily Calendar

[Put screenshot here]

- Daily calendar page at `/week`.
- Previous-day and next-day navigation.
- Day summary cards for courses, tasks, activities, and busy hours.
- All-day item list.
- Timed daily timetable.
- Current-time marker when viewing the current day.
- Mobile timetable list for small screens.
- Calendar events combine course meetings, exams, task due dates, planned task blocks, and activities.

## Course Notes and Note Editor

[Put screenshot here]

- Course notes list on course detail pages.
- Note editor page at `/notes/:noteId`.
- Create, read, update, and delete course notes.
- Rich-text editing controls including bold, italic, underline, headings, lists, quotes, tables, and images.
- Note image upload support.
- Word count display.
- Autosave/manual save behavior in the note editor.
- Print-based PDF export action.
- AI note assistant for grammar, outlines, summaries, clarity improvements, and section rewrites when OpenAI is configured.
- AI suggestion preview and apply flow.

## Friends

[Put screenshot here]

- Friends page at `/friends`.
- Search/add friend by email.
- Send friend requests.
- Accept incoming friend requests.
- Remove friends.
- Block and unblock users.
- Friend status overview.
- Friend notification badge support through the notifications API.
- Direct chat entry points from friend relationships.

## Chat

[Put screenshot here]

- Chat page at `/chat`.
- Direct chat route at `/chat/:friendId`.
- Conversation route at `/conversations/:chatId`.
- Conversation list with search.
- Direct conversations.
- Self/private notes chat.
- Group chat creation with selected accepted friends.
- Message sending and message history.
- Message editing and deletion.
- Chat deletion and chat clearing where supported.
- File attachments for chat messages.
- Image paste/upload support in the chat composer.
- Emoji and formatting tools.
- Group polls with voting and visible results.
- Group timers with countdown display.
- Server-sent event stream support for chat messages and timer updates.
- Unread conversation counts.

## Assistant Widget

[Put screenshot here]

- Floating study assistant widget available from navigation.
- Assistant panel for asking about tasks, due dates, and weekly planning.
- Markdown-style rendering for assistant responses.
- Backend assistant route at `/api/assistant/message`.
- OpenAI configuration required for AI-backed assistant responses.

## Statistics

[Put screenshot here]

- Statistics page at `/statistics`.
- Productivity statistics API at `/api/stats`.
- Task completion and workload information from database queries.
- Quick insight generation without OpenAI configuration.
- Optional AI insight generation through `/api/stats/insight` when OpenAI is configured.
- Rate limiting on AI statistics insight requests.

## Settings and Account Management

[Put screenshot here]

- Settings page at `/settings`.
- Profile update for name and email.
- Avatar upload using image files under the frontend size limit.
- Avatar removal.
- Language preference selection.
- Light/dark theme toggle from navigation.
- Browser/system notification controls.
- Replayable onboarding tour.
- Permanent account deletion.

## Language Support

[Put screenshot here]

- Interface language preference stored locally and in the user profile.
- Supported language codes in the database constraint: `en`, `ru`, `ko`, `kk`, and `uz`.
- Client-side translation dictionaries for application UI text.
- Document language attribute updates when the active language changes.

## Notifications

[Put screenshot here]

- Friend and unread-message badge data from `/api/notifications/friends`.
- Server-sent event stream at `/api/notifications/stream`.
- Browser notification utility for chat messages and task reminders.
- Public notification service worker in `client/public/notification-sw.js`.

## Uploads and File Storage

[Put screenshot here]

- Course image and banner uploads.
- Task attachment uploads.
- Chat attachment uploads.
- Note image uploads.
- Uploaded files served through `/uploads/:category/:fileId/:filename`.
- Uploaded file metadata and binary data stored through the `uploaded_files` table.

## Responsive Interface

[Put screenshot here]

- Desktop navigation with primary application sections.
- Mobile bottom navigation for core destinations.
- Mobile overflow menu for additional sections and account actions.
- Responsive layouts for dashboard, courses, tasks, activities, daily calendar, notes, and chat.
- Viewport synchronization helper for mobile viewport sizing.

## Backend API and Data Model

[Put screenshot here]

- Express API mounted under `/api`.
- Health route at `/health`.
- Protected routes using JWT authentication middleware.
- Repository and service layers for users, courses, tasks, calendar blocks, activities, friends, messages, chats, notes, uploads, notifications, and statistics.
- PostgreSQL migrations for users, courses, tasks, calendar blocks, friends, messages, attachments, course notes, chat conversations, polls, timers, uploaded files, language preference, and account schema cleanup.
- Migration script that records applied SQL files in `schema_migrations`.
