# About PLANЁRKA

PLANЁRKA is a student workspace for organizing academic work and personal study planning. It brings course management, task tracking, calendar planning, notes, friend connections, chat, and productivity statistics into a single web application.

## Purpose

Students often manage course schedules, assignments, notes, reminders, and group communication across separate tools. PLANORKA is designed to reduce that fragmentation by giving students one place to:

- create and manage courses;
- plan academic tasks and activities;
- view scheduled work on a daily calendar;
- keep course notes;
- communicate with friends and groups;
- review productivity statistics;
- use optional AI assistance for planning and note support.

## Goals

The project goals are:

- provide a practical academic planning tool for students;
- support both coursework and personal activity scheduling;
- connect tasks, courses, notes, and calendar blocks;
- provide a responsive interface for desktop and mobile use;
- include account personalization, language preference, and theme controls;
- demonstrate a full-stack implementation with authentication, database migrations, file uploads, and API-driven frontend pages.

## Target Users

The primary users are university students who need to manage classes, assignments, activities, notes, and study communication. The application is also suitable for students working on group projects because it includes friends, direct chat, group chat, polls, timers, and shared conversation tools.

## Technology Stack

The technologies below are taken from the project source, package files, and configuration files.

### Frontend

- React 19
- React DOM
- React Router DOM
- Vite
- Axios
- ESLint
- CSS modules/files in `client/src`
- Browser notification service worker in `client/public/notification-sw.js`

### Backend

- Node.js
- Express 5
- PostgreSQL
- `pg` PostgreSQL client
- JSON Web Token authentication with `jsonwebtoken`
- Password hashing with `bcryptjs`
- Request validation with `zod`
- File upload parsing with `multer`
- CORS handling with `cors`
- Environment configuration with `dotenv`
- Development restart support with `nodemon`

### AI Integration

- OpenAI Node package
- OpenAI Responses API endpoint configured in `server/src/config/openai.js`
- Default model from the repository code: `gpt-4o-mini`
- AI features require `OPENAI_API_KEY` in `server/.env`

### Database and Storage

- PostgreSQL database configured with `DATABASE_URL`
- SQL migrations in `server/migrations`
- `schema_migrations` table used by the migration script
- Uploaded files stored through the `uploaded_files` table for categories including courses, tasks, chat, and notes

### Deployment-Related Configuration

- `render.yaml` contains a Render static site configuration for the `client` directory.
- The Express app can also serve `client/dist` when a built frontend is available.

## Main Application Areas

- Authentication and account management
- Dashboard
- Courses
- Tasks
- Activities
- Daily calendar
- Notes
- Friends
- Chat
- Statistics
- Settings
- AI assistant widget
