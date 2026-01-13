# Cloudflare Production Deployment Guide

## 🚀 Deployment Checklist

### 1. Upload Secrets (Backend)

```bash
npx wrangler secret put NEWS_API_KEY
npx wrangler secret put JWT_SECRET
npx wrangler secret put ADMIN_API_KEY
```

### 2. Initialize Database

```bash
npx wrangler d1 migrations apply best-of-africa-db --remote
```

### 3. Deploy Backend (Worker)

```bash
npx wrangler deploy
# Note the URL output! (e.g., https://backend.your-project.workers.dev)
```

### 4. Deploy Frontend (Pages)

1. **Build:**

    ```bash
    cd frontend
    npm run build
    ```

2. **Deploy:**

    ```bash
    npx wrangler pages deploy dist --project-name best-of-africa-frontend
    ```

3. **Configure Connection:**
    * Go to **Cloudflare Dashboard** > **Pages** > **Settings** > **Environment variables**.
    * Add variable: `VITE_API_URL`
    * Value: `https://[YOUR-WORKER-URL]` (The URL from step 3)
    * **Redeploy** the frontend for this to take effect.
