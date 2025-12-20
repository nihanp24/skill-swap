Talent Trade (skill-swap starter)

Quick start (Windows):

1. Unzip the `skill-swap.zip` and open the folder in VS Code.
2. Open a terminal in VS Code and run backend:
   cd skill-swap\backend
   npm install
   npm run dev
3. Open another terminal and run frontend:
   cd skill-swap\frontend
   npm install
   npm run dev
4. Open your browser to http://localhost:5173
5. Register a new user (Name, Email, Password, Skills) — registration stores users in a local file (backend/db.json).
6. Open Dashboard -> use Search to find users by name or skill.

Notes:
- This starter uses a small file-based database (lowdb) so it runs without MongoDB.
- Sessions are stored on disk using session-file-store so you stay logged in across restarts.
- For production you'd switch to a hosted DB (e.g., MongoDB Atlas) and stronger session security.
