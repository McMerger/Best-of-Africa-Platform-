# Deployment Instructions

**Status:**
✅ Configuration Complete
✅ Backend Deployed
✅ Frontend Deployed

## 🚀 Live URLs

**Frontend (App):**
[https://best-of-africa-frontend.pages.dev](https://best-of-africa-frontend.pages.dev)

**Backend (API):**
[https://best-of-africa-backend.cortesmailles01.workers.dev](https://best-of-africa-backend.cortesmailles01.workers.dev)

## 🛠 Troubleshooting

If you need to redeploy:

**Backend:**

```bash
npx wrangler deploy
```

**Frontend:**

```bash
cd frontend
$env:VITE_API_URL="https://best-of-africa-backend.cortesmailles01.workers.dev"; npm run build
npx wrangler pages deploy dist --project-name best-of-africa-frontend
```
