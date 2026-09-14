# CampusNotes

CampusNotes is a role-based academic notes platform. Students upload PDF notes, administrators review them, and master users manage administrators, subjects, users, permissions, and statistics.

## Features

- JWT authentication and protected routes
- Student registration and login
- PDF note upload, reading, and downloading
- Note approval, rejection, and versioning
- Admin access restricted by assigned subjects
- Configurable admin permissions
- Master management of users, admins, subjects, and statistics
- Search and status filtering in the notes library
- Separate React interfaces for student, admin, and master workflows

## Technology

- Frontend: React, React Router, Vite, Axios, React-PDF
- Backend: Node.js, Express, Mongoose, MongoDB
- Authentication: JWT
- Password hashing: bcryptjs
- File uploads: Multer

## Project Structure

```text
CampusNotes/
├── client/
│   ├── src/
│   │   ├── components/       Shared navigation and route protection
│   │   ├── context/          Authentication context
│   │   ├── pages/            Student, admin, and master screens
│   │   └── services/         Axios API client
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── config/               Database configuration
│   ├── controllers/          Request handlers
│   ├── middleware/           Authentication, roles, permissions, uploads
│   ├── models/               User, Subject, and Note schemas
│   ├── routes/               Express route modules
│   ├── uploads/              Uploaded PDF files
│   ├── server.js             Express entry point
│   ├── seedMaster.js         Development master-account seed
│   └── package.json
├── README.md
└── .git/
```

## Requirements

- Node.js 18 or newer
- npm
- MongoDB Atlas account or local MongoDB server
- Git

## Installation

Clone the repository and install dependencies for both applications:

```bash
git clone <YOUR_REPOSITORY_URL>
cd CampusNotes

cd server
npm install

cd ../client
npm install
```

## Environment Configuration

Create `server/.env`:

```env
PORT=5000
MONGO_URI=<YOUR_MONGODB_CONNECTION_STRING>
JWT_SECRET=<YOUR_LOCAL_JWT_SECRET>
```

Do not commit `.env` or real credentials. In MongoDB Atlas, create a database user and allow your development IP address under Network Access.

Ensure the upload directory exists:

```text
server/uploads/
```

## Development

Start the backend in one terminal:

```bash
cd server
npm run dev
```

Start the frontend in a second terminal:

```bash
cd client
npm run dev
```

Open the Vite URL shown in the terminal, normally:

```text
http://localhost:5173
```

The API normally runs at:

```text
http://localhost:5000
```

## Master Account Seed

After configuring `server/.env`, create the first master account:

```bash
cd server
npm run seed:master
```

The current development seed creates:

```text
Email: master@test.com
Password: Master@12345
Role: master
```

Change the seed credentials before using this outside local development. The seed exits without creating another account if a master already exists.

## Available Scripts

### Client

```bash
npm run dev       # Start Vite development server
npm run build     # Create a production build
npm run lint      # Run ESLint
npm run preview   # Preview the production build
```

### Server

```bash
npm run dev         # Start server with nodemon
npm start           # Start server with Node.js
npm run seed:master # Create the first master account
```

## User Roles

### Student

- Register and log in
- Upload PDF notes
- View approved current notes
- Read and download available notes
- Delete owned pending notes
- Upload new versions of approved notes when allowed by the application flow

### Admin

Admin access is limited by assigned subjects and permissions:

- `approveNotes`
- `rejectNotes`
- `deleteNotes`
- `editContent`
- `manageSubjects`
- `disableUsers`
- `viewStatistics`

### Master

Masters have global management access and can:

- Manage administrators
- Assign subjects to administrators
- Set administrator permissions
- Manage subjects
- Manage users and user roles
- Enable or disable users
- View master and admin dashboard statistics

## Main Frontend Routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/login` | Public | Sign in |
| `/register` | Public | Create a student account |
| `/notes` | Authenticated | Browse approved notes |
| `/my-notes` | Authenticated | View uploaded notes |
| `/upload` | Authenticated | Upload a PDF note |
| `/admin` | Admin, Master | Admin dashboard |
| `/admin/notes/pending` | Admin, Master | Review pending notes |
| `/admin/notes/manage` | Admin, Master | Manage accessible notes |
| `/master` | Master | Master dashboard |
| `/master/users` | Master | Manage users |
| `/master/admins` | Master | Manage administrators |
| `/master/subjects` | Master | Manage subjects |

## Main API Endpoints

All API endpoints use the `/api` prefix.

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

Protected requests use:

```text
Authorization: Bearer <JWT_TOKEN>
```

### Notes

```text
GET    /api/notes
GET    /api/notes/my
GET    /api/notes/:id
GET    /api/notes/:id/read
GET    /api/notes/:id/download
POST   /api/notes
POST   /api/notes/:id/version
DELETE /api/notes/:id
```

### Admin Notes

```text
GET /api/admin/notes
GET /api/admin/notes/pending
GET /api/admin/notes/manage
GET /api/admin/notes/:id
GET /api/admin/notes/:id/preview
GET /api/admin/notes/:id/read
PUT /api/admin/notes/:id/approve
PUT /api/admin/notes/:id/reject
```

### Admin Dashboard

```text
GET /api/admin/dashboard/stats
```

### Master Management

```text
GET    /api/master/dashboard
GET    /api/master/dashboard/stats
GET    /api/master/users
PUT    /api/master/users/:id/role
PUT    /api/master/users/:id/toggle-status
GET    /api/master/admins
POST   /api/master/admins
PUT    /api/master/admins/:id/permissions
PUT    /api/master/admins/:id/subjects
PUT    /api/master/admins/:id/toggle-status
DELETE /api/master/admins/:id
GET    /api/master/subjects
POST   /api/master/subjects
PUT    /api/master/subjects/:id
PUT    /api/master/subjects/:id/toggle-status
```

## Typical Workflow

1. Configure MongoDB and `server/.env`.
2. Run `npm run seed:master` from `server/`.
3. Start the server and client.
4. Log in as the master user.
5. Create subjects.
6. Create an admin and assign subjects and permissions.
7. Register or create a student account.
8. Upload a PDF note as a student.
9. Review, approve, or reject the pending note as an authorized admin.
10. Read and download approved current notes.

## Troubleshooting

### MongoDB connection errors

- Confirm `MONGO_URI` is present in `server/.env`.
- Confirm the MongoDB user and password are correct.
- Confirm your current IP is allowed by MongoDB Atlas.

### Unauthorized requests

- Log in again to obtain a current JWT.
- Check that the request includes the Bearer token.
- Confirm the user role, assigned subjects, and permissions.

### PDF upload or read errors

- Confirm `server/uploads/` exists and is writable.
- Confirm the uploaded file is a PDF.
- Check that the server is running on the URL configured by the client API service.

### Frontend build issues

```bash
cd client
npm run lint
npm run build
```
