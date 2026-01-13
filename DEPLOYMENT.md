# Deployment Instructions

**1. Configure Backend Secrets**
Set these in the Worker settings:

* `NEWS_API_KEY`: `159f52859d124d4aacb38279529a3765`
* `JWT_SECRET`: `f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2`
* `ADMIN_API_KEY`: `880e9511-f30c-52d5-b827-557766551111`

**2. Initialize Database**
Run the migration:

```bash
npx wrangler d1 migrations apply best-of-africa-db --remote
```

**3. Deploy Backend**
Deploy the Worker:

```bash
npx wrangler deploy
```

**Important:** Copy the URL it outputs (e.g., `https://backend.worker.dev`).

**4. Deploy Frontend**
Build and deploy the React app:

```bash
cd frontend && npm run build
npx wrangler pages deploy dist --project-name best-of-africa-frontend
```

**5. Connect Frontend to Backend**
Go to the **Pages Settings** -> **Environment Variables** and add:

* `VITE_API_URL`: `[The URL from Step 3]`

Then redeploy the frontend one last time.
