# CampusNotes

CampusNotes is a role-based academic notes-sharing platform. Students upload PDF notes, administrators review and approve them, and master users manage administrators, subjects, users, permissions, and system statistics.

## Features

- JWT authentication and protected routes
- Student registration and login
- PDF note upload, reading, and downloading
- Backblaze B2 cloud storage for PDF files
- Note approval, rejection, and versioning
- Admin access restricted by assigned subjects
- Configurable administrator permissions
- Master management of users, admins, subjects, and permissions
- Search and status filtering in the notes library
- Download analytics and subject rankings
- Date-filtered analytics
- CSV export for statistical analysis
- Separate React interfaces for student, admin, and master workflows
- Responsive frontend interfaces

## Technology Stack

### Frontend

- React
- React Router
- Vite
- Axios
- React-PDF
- CSS

### Backend

- Node.js
- Express.js
- Mongoose
- MongoDB Atlas or local MongoDB
- JWT authentication
- bcryptjs password hashing
- Multer file uploads
- Backblaze B2 cloud storage

## Project Structure

```text
CampusNotes/
├── client/
│   ├── src/
│   │   ├── components/       # Shared components and navigation
│   │   ├── context/          # Authentication context
│   │   ├── pages/            # Student, admin, and master screens
│   │   └── services/         # Axios API client
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── config/               # Database configuration
│   ├── controllers/          # Request handlers and business logic
│   ├── middleware/           # Authentication, roles, permissions, uploads
│   ├── models/               # User, Subject, Note, and DownloadEvent models
│   ├── routes/               # Express API routes
│   ├── services/             # Backblaze B2 storage integration
│   ├── uploads/              # Local uploads, if used by the application
│   ├── server.js             # Express entry point
│   ├── seedMaster.js         # Development master-account seed
│   └── package.json
│
├── README.md
└── .git/
```

The exact files and directories may differ slightly depending on the current implementation.

## Requirements

Install the following before starting the project:

- Node.js 18 or newer
- npm
- MongoDB Atlas account or local MongoDB installation
- Backblaze B2 account
- Git

## Installation

### 1. Clone the repository

Replace the placeholder with your actual repository URL.

```bash
git clone <YOUR_REPOSITORY_URL>
cd CampusNotes
```

### 2. Install backend dependencies

```bash
cd server
npm install
```

### 3. Install frontend dependencies

```bash
cd ../client
npm install
```

## Environment Configuration

Create a `.env` file inside the `server/` directory.

```env
PORT=5000
MONGO_URI=<YOUR_MONGODB_CONNECTION_STRING>
JWT_SECRET=<YOUR_SECURE_JWT_SECRET>
```

Add the Backblaze B2 environment variables required by your storage service, as explained in the next section.

Do not commit `.env` files, database credentials, JWT secrets, or cloud storage application keys to Git.

### MongoDB Configuration

1. Create a MongoDB Atlas account or configure a local MongoDB instance.
2. Create a database user.
3. Configure Network Access to allow your development IP address.
4. Copy the MongoDB connection string.
5. Set the connection string in `MONGO_URI`.

Ensure the connection string contains the correct username, password, cluster, and database settings.

## Backblaze B2 Cloud Storage Configuration

CampusNotes uses Backblaze B2 to store PDF notes in cloud storage. Configure the cloud storage credentials before testing uploads, reading, and downloading.

### 1. Create a B2 bucket

1. Sign in to [Backblaze](https://www.backblaze.com/).
2. Open the B2 Cloud Storage dashboard.
3. Create a bucket for CampusNotes PDF files.
4. Keep the bucket private unless your application explicitly requires a different configuration.

### 2. Create an application key

1. Open the **App Keys** section of the Backblaze dashboard.
2. Create an application key for CampusNotes.
3. Grant only the permissions required by your application, such as uploading, downloading, and deleting files.
4. Save the key ID and application key securely.

### 3. Add cloud storage credentials

Add the variables used by your existing `server/services/b2Storage.js` implementation to `server/.env`.

The following names are examples only; use the exact names referenced in your storage service.

```env
B2_KEY_ID=<YOUR_B2_APPLICATION_KEY_ID>
B2_APPLICATION_KEY=<YOUR_B2_APPLICATION_KEY>
B2_BUCKET_NAME=<YOUR_B2_BUCKET_NAME>
```

If your storage service requires an endpoint, region, or additional configuration, add those variables as well.

**Important:** Do not assume the example variable names above match your code. Verify them against `server/services/b2Storage.js` before starting the application.

### 4. Verify cloud storage

After starting the application:

1. Log in to CampusNotes.
2. Upload a valid PDF note as a student.
3. Confirm that the PDF appears in your B2 bucket.
4. Approve the note through an authorized Admin or Master account.
5. Test reading and downloading the approved note.

If uploads or downloads fail, check the backend terminal logs, B2 credentials, bucket name, and application key permissions.

### Cloud Storage Security

- Never expose B2 application keys in frontend code.
- Never commit cloud credentials to Git.
- Keep private notes in a private bucket when using authenticated or backend-generated access.
- Use appropriately restricted credentials for development and production.
- Ensure file access is authorized by the backend before providing a file or download URL.

## Start the Application

Start the backend and frontend in separate terminals.

### Terminal 1: Start the backend

```bash
cd CampusNotes/server
npm run dev
```

The API normally runs at:

```text
http://localhost:5000
```

If `npm run dev` is unavailable, check the scripts in `server/package.json`.

### Terminal 2: Start the frontend

```bash
cd CampusNotes/client
npm run dev
```

Vite normally serves the application at:

```text
http://localhost:5173
```

Use the actual URL printed by Vite if the port differs.

### Application URLs

| Service | Development URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| API prefix | http://localhost:5000/api |

The frontend API base URL should match the backend address configured in the Axios client.

## Master Account Seed

After configuring the backend environment, create the initial master account using the seed script.

```bash
cd server
npm run seed:master
```

The current development seed is documented as creating:

```text
Email: master@test.com
Password: Master@12345
Role: master
```

These credentials are for local development only. Change the seed credentials before using the application outside a controlled development environment.

The seed script exits without creating another account if a master already exists.

## Available Scripts

### Client

Run these commands from `client/`.

```bash
npm run dev       # Start Vite development server
npm run build     # Build the frontend for production
npm run lint      # Run ESLint
npm run preview   # Preview the production build
```

### Server

Run these commands from `server/`.

```bash
npm run dev         # Start the backend with nodemon
npm start           # Start the backend with Node.js
npm run seed:master # Create the initial master account
```

The available scripts depend on the commands defined in each `package.json`.

## User Roles and Permissions

### Student

Students can:

- Register and log in.
- Browse approved, current notes.
- Search and filter available notes.
- Read and download approved PDF notes.
- Upload PDF notes.
- View the status of their uploads.
- Delete their own pending notes where permitted.
- Upload new versions where the application allows it.

### Admin

Administrators operate within their assigned subjects and configured permissions.

Available permissions include:

- `approveNotes`
- `rejectNotes`
- `deleteNotes`
- `editContent`
- `manageSubjects`
- `disableUsers`
- `viewStatistics`

Admins can review and manage notes only within the scope permitted by the backend.

Statistics access requires the `viewStatistics` permission.

### Master

Master users have system-wide management access and can:

- Create, update, and remove administrators.
- Assign subjects to administrators.
- Configure administrator permissions.
- Manage subjects.
- Manage user accounts and roles.
- Enable or disable accounts.
- View system-wide dashboard statistics.
- View download analytics and subject rankings.
- Filter analytics by date.
- Export analytics as CSV.

## Main Frontend Routes

| Route | Access | Purpose |
|---|---|---|
| `/login` | Public | Sign in |
| `/register` | Public | Register a student account |
| `/notes` | Authenticated | Browse approved notes |
| `/my-notes` | Authenticated | View uploaded notes |
| `/upload` | Authenticated | Upload a PDF |
| `/admin` | Admin, Master | Admin dashboard |
| `/admin/notes/pending` | Admin, Master | Review pending notes |
| `/admin/notes/manage` | Admin, Master | Manage accessible notes |
| `/master` | Master | Master dashboard |
| `/master/users` | Master | Manage users |
| `/master/admins` | Master | Manage administrators |
| `/master/subjects` | Master | Manage subjects |

Actual route protection is enforced by the application and its backend authorization middleware.

## Main API Endpoints

All API endpoints use the `/api` prefix.

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

Protected requests use a JWT bearer token:

```text
Authorization: Bearer <JWT_TOKEN>
```

The frontend Axios instance automatically attaches the saved JWT when configured to do so.

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

These endpoints support note discovery, uploads, reading, downloading, and version management, subject to the application's authorization rules.

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

### Admin Dashboard and Analytics

```text
GET /api/admin/dashboard/stats
GET /api/admin/dashboard/analytics
GET /api/admin/dashboard/analytics/export
```

The analytics endpoint supports optional date filters:

```text
GET /api/admin/dashboard/analytics?from=2026-10-01&to=2026-10-20
```

The export endpoint supports the same filters:

```text
GET /api/admin/dashboard/analytics/export?from=2026-10-01&to=2026-10-20
```

Dates use the `YYYY-MM-DD` format.

Analytics include:

- Total notes and note-status counts.
- Total downloads.
- Most-downloaded notes.
- Subject download rankings.
- Date-filtered download activity.

The CSV export can be opened in spreadsheet software for further analysis.

**Historical data note:** Date-filtered download statistics depend on recorded download events. Downloads from before event tracking was introduced cannot be reconstructed by date unless historical event data is available. Lifetime totals use existing note download counters.

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

These endpoints are subject to the actual routes and authorization middleware implemented in the backend.

## Typical Workflow

1. Configure MongoDB, JWT, and Backblaze B2.
2. Install backend and frontend dependencies.
3. Run `npm run seed:master` from `server/`.
4. Start the backend and frontend in separate terminals.
5. Log in as the master user.
6. Create subjects.
7. Create an administrator and assign subjects and permissions.
8. Register or create a student account.
9. Upload a PDF note as a student.
10. Review and approve or reject the note as an authorized administrator.
11. Read and download approved notes.
12. View dashboard statistics and download analytics.
13. Export analytics to CSV for further analysis.

## Testing

### Authentication

- Register a student.
- Log in and verify the JWT.
- Confirm protected endpoints reject unauthenticated requests.
- Verify role-based access restrictions.

### Notes

- Upload a valid PDF.
- Confirm non-PDF and oversized files are rejected according to the configured limits.
- Approve or reject a pending note.
- Verify that only approved current notes are available to students.
- Test reading and downloading.
- Verify note versioning behavior.

### Permissions

- Test an admin with assigned subjects.
- Verify the admin cannot access notes outside the assigned subjects.
- Verify statistics access is denied when `viewStatistics` is disabled.
- Verify Master access remains system-wide.

### Analytics and CSV Export

- Download an approved current note.
- Verify that its download counter increases.
- Verify a download event is recorded.
- Request analytics without date filters.
- Request analytics with a valid date range.
- Verify most-downloaded notes and subject rankings.
- Export CSV and open the file in spreadsheet software.
- Confirm an admin sees only statistics within the permitted subject scope.

## Troubleshooting

### MongoDB connection errors

- Confirm `MONGO_URI` is present in `server/.env`.
- Check the MongoDB username and password.
- Verify the database name and connection string.
- Confirm the development IP is allowed by MongoDB Atlas.
- Check backend logs for connection errors.

### Unauthorized requests

- Log in again to obtain a valid JWT.
- Confirm the request contains the Bearer token.
- Verify the account is active.
- Check the user role, assigned subjects, and permissions.
- Confirm the relevant route uses the intended authorization middleware.

### Backblaze B2 errors

- Confirm the B2 bucket exists.
- Check the application key ID and application key.
- Verify the environment variable names against `server/services/b2Storage.js`.
- Confirm the application key has the required bucket permissions.
- Restart the backend after changing `.env`.
- Check the backend logs for upload, read, or download errors.

### PDF upload or read errors

- Confirm the uploaded file is a PDF.
- Check configured upload-size limits.
- Verify B2 configuration if the file is stored in cloud storage.
- If local storage is used for a particular file, confirm the local file exists and the server has permission to access it.
- Confirm the note is approved and current before testing student downloads.

### Analytics errors

- Confirm the analytics routes are registered in the Express application.
- Verify that the authenticated role is allowed to access the endpoints.
- For Admin accounts, confirm `viewStatistics` is enabled.
- Ensure `DownloadEvent` records are created when downloads occur.
- Use valid date parameters in `YYYY-MM-DD` format.
- Remember that date-filtered statistics cannot include unrecorded historical downloads.

### CSV export errors

- Confirm the export endpoint returns a successful response.
- Verify the Axios request uses `responseType: "blob"`.
- Ensure the request uses the authenticated Axios instance.
- Check the browser console and backend logs for errors.

### Frontend build issues

Run:

```bash
cd client
npm run lint
npm run build
```

Resolve any reported errors before deploying.

## Security Best Practices

- Never commit `.env` files or credentials.
- Use a strong, randomly generated JWT secret.
- Use restricted cloud storage application keys.
- Keep private files inaccessible to unauthorized users.
- Enforce role and permission checks on the backend.
- Validate and sanitize user inputs.
- Keep dependencies updated.
- Change development seed credentials before production use.
- Do not expose secrets in frontend environment variables or browser code.


