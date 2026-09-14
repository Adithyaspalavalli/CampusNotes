# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


CAMPUSNOTES LOCAL SETUP

1. Install:
   - Git
   - Node.js
   - VS Code
   - Postman

2. Clone:
   git clone <GITHUB_REPOSITORY_URL>

3. Enter project:
   cd CampusNotes

4. Install frontend:
   cd client
   npm install

5. Install backend:
   cd ../server
   npm install

6. Create your own MongoDB Atlas database.

7. Create your own MongoDB database user.

8. Add your current IP in:
   MongoDB Atlas
   → Network Access
   → Add My Current IP Address

9. Create:
   server/.env

10. Put your own values:
   PORT=5000
   MONGO_URI=<YOUR_MONGODB_CONNECTION_STRING>
   JWT_SECRET=<YOUR_LOCAL_SECRET>

11. Make sure:
   server/uploads/
   exists.

12. Start backend:
   cd server
   npm run dev

13. Open another terminal.

14. Start frontend:
   cd client
   npm run dev

15. Open:
   http://localhost:5173

16. Create the initial Master using the project's
   approved development seed/setup method.

17. Login as Master.

18. Create subjects.

19. Create Admin.

20. Assign subjects and permissions.

21. Create Student account.

22. Upload PDF.

23. Test approval/rejection.

24. Test downloads.

25. Test all Admin permissions.

npm run seed:master

You should get:

Connected to MongoDB.

Master created successfully!
--------------------------------
Name: CampusNotes Master
Email: master@test.com
Password: Master@12345
Role: master
--------------------------------

🎉 Your first Master now exists in that MongoDB database.


Step 12 — Your friend's complete process

Once you've pushed seedMaster.js and the package.json change to GitHub, your friend can do:

git clone YOUR_GITHUB_REPOSITORY

Then:

cd CampusNotes

Frontend:

cd client
npm install

Backend:

cd ../server
npm install

Create his own:

server/.env

with his own:

MONGO_URI=his_mongodb_connection_string
JWT_SECRET=his_secret
PORT=5000

Then:

npm run seed:master

He gets:

Master created successfully!

Then:

npm run dev

And in another terminal:

cd client
npm run dev

Then:

http://localhost:5173

Login:

master@test.com
Master@12345