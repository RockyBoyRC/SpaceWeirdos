# Deployment Options for Space Weirdos Warband Builder

This document provides deployment instructions for interactive testing of the Space Weirdos Warband Builder application.

## Table of Contents

- [Option 1: Local Development](#option-1-local-development-recommended-for-immediate-testing)
- [Option 2: Vercel](#option-2-vercel-quick-public-deployment)
- [Option 5: Render](#option-5-render-recommended-for-simplicity)

---

## Option 1: Local Development (Recommended for Immediate Testing)

**Best for:** Quick testing, development iteration, debugging

### Prerequisites

- Node.js v20+ installed
- npm installed
- Git repository cloned

### Setup Instructions

1. **Install dependencies:**
```bash
npm install
```

2. **Start the backend server (Terminal 1):**
```bash
npm run dev:backend
```

3. **Start the frontend dev server (Terminal 2):**
```bash
npm run dev:frontend
```

### Access Points

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Health Check:** http://localhost:3001/api/health

### Features

✅ **Pros:**
- Instant setup (< 1 minute)
- Hot reload for both frontend and backend
- Easy debugging with source maps
- Full access to logs and console
- No deployment costs
- Works offline

❌ **Cons:**
- Only accessible on your local machine
- Requires keeping terminals open
- Not suitable for sharing with others

### Testing the Application

1. Open http://localhost:3000 in your browser
2. Click "Create New Warband"
3. Fill in warband details (name, point limit, ability)
4. Add a leader and customize attributes
5. Add weapons, equipment, and psychic powers
6. Watch real-time cost calculations
7. Save the warband
8. Test loading, editing, and deleting warbands

### Troubleshooting

**Port already in use:**
```bash
# Kill process on port 3001 (backend)
npx kill-port 3001

# Kill process on port 3000 (frontend)
npx kill-port 3000
```

**Data not persisting:**
- Check that `data/warbands.json` exists
- Verify file permissions
- Check backend console for errors

---

## Option 2: Vercel (Quick Public Deployment)

**Best for:** Quick public deployment, sharing with others, free hosting

### Prerequisites

- Vercel account (free tier available)
- GitHub repository (already set up ✅)
- Vercel CLI installed

### Setup Instructions

#### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

#### Step 2: Configuration Files

The following files have been created for you:

**`vercel.json`** (project-specific configuration):

This file is stored in your repository and applies only to this project. If you deploy other projects to the same Vercel account, each will have its own `vercel.json` (or none if using defaults).
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/backend/server.ts",
      "use": "@vercel/node"
    },
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist/frontend"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "src/backend/server.ts"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

#### Step 3: Deploy

```bash
# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel

# Deploy to production
vercel --prod
```

### Access Points

After deployment, Vercel will provide:
- **Production URL:** `https://your-app-name.vercel.app`
- **Preview URLs:** For each deployment

### Features

✅ **Pros:**
- Free tier available (generous limits)
- Automatic HTTPS
- Global CDN for fast loading
- Easy custom domains
- Git integration (auto-deploy on push)
- Preview deployments for branches
- Zero configuration needed
- Instant deployments (< 1 minute)

❌ **Cons:**
- Serverless functions have cold starts (~1-2 seconds)
- File persistence doesn't work (serverless environment)
- Need to add database for persistent storage
- 10-second function timeout on free tier

### Important Notes

⚠️ **Data Persistence Issue:**

Vercel uses serverless functions, which means:
- File writes to `data/warbands.json` won't persist
- Data resets on each deployment
- Need to integrate a database for production use

**Solutions:**
1. **Quick fix:** Use browser localStorage only (frontend-only storage)
2. **Better fix:** Add a database (Vercel Postgres, MongoDB Atlas, etc.)

### Recommended Database Integration

For persistent storage on Vercel, consider:

**Option A: Vercel Postgres (Recommended)**
```bash
# Add Vercel Postgres
vercel postgres create
```

**Option B: MongoDB Atlas (Free tier)**
```bash
npm install mongodb
```

### Multiple Applications on Same Account

Vercel is designed to handle multiple projects on a single account. Each project is completely isolated:

**Automatic Isolation:**
- ✅ Each project gets its own unique URL (e.g., `project-name.vercel.app`)
- ✅ Each project has its own environment variables
- ✅ Each project has its own deployment pipeline
- ✅ Each project has its own logs and analytics
- ✅ Each serverless function runs in isolation
- ✅ No port conflicts (serverless architecture)

**Best Practices for Multiple Apps:**

1. **Project Naming:** Use descriptive project names
   - `space-weirdos-warband-builder`
   - `my-portfolio`
   - `company-api`

2. **Git Repository:** Each project can be linked to:
   - Different GitHub repositories
   - Different branches of the same repository
   - Different subdirectories (monorepo support)

3. **Environment Variables:** Set per-project
   - Each project has its own environment variables
   - Can have different values for same variable names
   - No conflicts between projects

4. **Resource Limits:** Free tier limits apply per account
   - 100GB bandwidth/month (shared across all projects)
   - 100 hours serverless function execution/month (shared)
   - Unlimited projects on free tier
   - Consider which projects need most resources

5. **Serverless Architecture:** No port management needed
   - Vercel uses serverless functions
   - Each function invocation is isolated
   - No traditional "port" concept
   - Automatic scaling per project

**Example Multi-App Setup:**
```
Account: your-vercel-account
├── space-weirdos-warband-builder
│   ├── Repo: RockyBoyRC/SpaceWeirdos
│   └── URL: https://space-weirdos.vercel.app
├── my-blog
│   ├── Repo: RockyBoyRC/blog
│   └── URL: https://my-blog.vercel.app
└── portfolio-site
    ├── Repo: RockyBoyRC/portfolio
    └── URL: https://portfolio.vercel.app
```

Each project is completely independent with no interference.

**Important Considerations:**

⚠️ **Shared Resource Limits:**
- Bandwidth is shared across all projects
- Function execution time is shared
- Monitor usage in dashboard to avoid hitting limits

✅ **Unlimited Projects:**
- Free tier allows unlimited projects
- Each project can have unlimited deployments
- Preview deployments for every git push

### Vercel Dashboard

Access your deployment dashboard at:
- https://vercel.com/dashboard

Features:
- View all projects in one place
- Monitor bandwidth usage across projects
- View deployment logs per project
- Configure environment variables per project
- Set up custom domains per project
- View analytics per project
- Manage team access per project

---

## Option 5: Render (Recommended for Simplicity)

**Best for:** Zero-config deployment, free tier with persistence, sharing with others

### Prerequisites

- Render account (free tier available)
- GitHub repository (already set up ✅)

### Setup Instructions

#### Step 1: Create Render Account

1. Go to https://render.com
2. Sign up with GitHub (recommended)
3. Authorize Render to access your repositories

#### Step 2: Create Web Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository: `RockyBoyRC/SpaceWeirdos`
3. Configure the service:

**Service Configuration:**
```
Name: space-weirdos-warband-builder
Region: Choose closest to you
Branch: main
Root Directory: (leave empty)
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm run start:production
```

**Environment Variables:**
```
NODE_ENV=production
```

**Note:** Do NOT set a custom PORT variable. Render automatically assigns a port and sets the PORT environment variable. Your application reads `process.env.PORT` which is already configured in the code.

**Instance Type:**
- Select "Free" tier

#### Step 3: Deploy

1. Click "Create Web Service"
2. Wait for deployment (2-5 minutes)
3. Access your app at the provided URL

### Access Points

After deployment, Render provides:
- **Production URL:** `https://your-app-name.onrender.com`
- **Dashboard:** https://dashboard.render.com

### Features

✅ **Pros:**
- Free tier available (750 hours/month)
- Zero configuration required
- Automatic deploys from GitHub
- Persistent disk available (free tier: 1GB)
- Automatic HTTPS
- Easy environment variables
- Built-in logging
- Health checks
- Custom domains (free)
- No cold starts on paid tier

❌ **Cons:**
- Free tier spins down after 15 minutes of inactivity
- Cold start takes ~30-60 seconds on free tier
- Limited to 750 hours/month on free tier
- Slower than paid tiers

### Persistent Storage Setup

Render supports persistent disks:

1. In your service settings, go to "Disks"
2. Add a disk:
   - **Name:** `data`
   - **Mount Path:** `/app/data`
   - **Size:** 1GB (free tier)
3. Save changes
4. Redeploy

This ensures your warband data persists across deployments!

### Automatic Deployments

Render automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Render will:
1. Detect the push
2. Build the application
3. Deploy automatically
4. Notify you when complete

### Monitoring

**View Logs:**
1. Go to your service dashboard
2. Click "Logs" tab
3. View real-time logs

**Health Checks:**
Render automatically monitors:
- HTTP endpoint: `/api/health`
- Response time
- Uptime

**Metrics:**
- CPU usage
- Memory usage
- Request count
- Response times

### Custom Domain

1. Go to service settings
2. Click "Custom Domains"
3. Add your domain
4. Update DNS records as instructed
5. Render handles SSL automatically

### Environment Variables

Add environment variables in dashboard:
```
NODE_ENV=production
```

**Important:** Do NOT manually set the PORT variable. Render automatically assigns a unique port to each service and injects it as an environment variable. Your code already uses `process.env.PORT || 3001`, which will use Render's assigned port in production and 3001 for local development.

### Multiple Applications on Same Account

Render is designed to handle multiple applications on a single account. Each service is completely isolated:

**Automatic Isolation:**
- ✅ Each service gets its own unique URL
- ✅ Each service gets its own assigned PORT (automatically managed)
- ✅ Each service has its own environment variables
- ✅ Each service has its own persistent disk (if configured)
- ✅ Each service has its own build and deployment pipeline
- ✅ Each service has its own logs and metrics

**Best Practices for Multiple Apps:**

1. **Naming Convention:** Use descriptive service names
   - `space-weirdos-warband-builder`
   - `my-other-app-name`
   - `project-name-api`

2. **Environment Variables:** Set per-service, not account-wide
   - Each service has its own environment variables
   - No conflicts between services

3. **Resource Limits:** Free tier limits apply per account
   - 750 hours/month total across all free services
   - 1GB disk per service
   - Consider which apps need to stay active

4. **Port Management:** Never hardcode ports
   - Always use `process.env.PORT` in your code ✅ (already done)
   - Render assigns unique ports automatically
   - No port conflicts possible

**Example Multi-App Setup:**
```
Account: your-render-account
├── space-weirdos-warband-builder (Port: 10000 - auto-assigned)
│   └── URL: https://space-weirdos.onrender.com
├── my-blog-api (Port: 10001 - auto-assigned)
│   └── URL: https://my-blog-api.onrender.com
└── portfolio-site (Port: 10002 - auto-assigned)
    └── URL: https://portfolio.onrender.com
```

Each service is completely independent and won't interfere with others.

### Troubleshooting

**Service won't start:**
- Check logs in dashboard
- Verify build command succeeded
- Check start command is correct
- Ensure you're NOT setting a custom PORT variable

**Cold starts too slow:**
- Upgrade to paid tier ($7/month)
- Or keep service warm with uptime monitor

**Data not persisting:**
- Verify persistent disk is mounted
- Check mount path is `/app/data`
- Ensure `data/warbands.json` uses correct path

**Port conflicts (shouldn't happen):**
- Render manages ports automatically
- If you see port errors, remove any custom PORT environment variable
- Verify your code uses `process.env.PORT` not a hardcoded port

---

## Comparison Matrix

| Feature | Local Dev | Vercel | Render |
|---------|-----------|--------|--------|
| **Setup Time** | < 1 min | 5 mins | 5 mins |
| **Cost** | Free | Free tier | Free tier |
| **Public Access** | ❌ | ✅ | ✅ |
| **HTTPS** | ❌ | ✅ | ✅ |
| **Persistent Storage** | ✅ | ❌* | ✅ |
| **Cold Starts** | ❌ | ~1-2s | ~30-60s |
| **Auto Deploy** | ❌ | ✅ | ✅ |
| **Custom Domain** | ❌ | ✅ | ✅ |
| **Debugging** | ✅✅✅ | ⚠️ | ⚠️ |
| **Multi-App Support** | N/A | ✅ Unlimited | ✅ Unlimited |
| **Resource Sharing** | N/A | Shared limits | Shared hours |
| **Best For** | Development | Static/Serverless | Full-Stack |

*Requires database integration

### Multi-App Considerations

**Vercel:**
- Unlimited projects on free tier
- Shared bandwidth (100GB/month) and function execution (100 hours/month)
- Each project completely isolated
- No port conflicts (serverless)
- Best for: Multiple small projects, static sites, APIs

**Render:**
- Unlimited services on free tier
- Shared hours (750 hours/month total)
- Each service completely isolated
- Automatic port assignment per service
- Best for: Full-stack apps needing persistence

---

## Recommendations

### For Immediate Testing
**Use Option 1 (Local Development)**
- Fastest setup
- Best for development
- Full debugging capabilities

### For Sharing with Team
**Use Option 5 (Render)**
- Easy setup
- Persistent storage works
- Free tier sufficient
- Automatic deployments

### For Production
**Use Option 5 (Render) with paid tier**
- No cold starts
- Better performance
- More resources
- 24/7 uptime

---

## Next Steps

After deploying, test these workflows:

1. **Create Warband:** Test warband creation with all fields
2. **Cost Calculation:** Verify real-time cost updates
3. **Validation:** Test all validation rules (point limits, equipment limits, etc.)
4. **Persistence:** Save, reload, and verify data persists
5. **CRUD Operations:** Test create, read, update, delete
6. **Edge Cases:** Test with maximum values, empty fields, etc.

---

## Support

For deployment issues:
- **Local:** Check console logs in both terminals
- **Vercel:** Check deployment logs at https://vercel.com/dashboard
- **Render:** Check logs in service dashboard

For application issues:
- Check browser console (F12)
- Check network tab for API errors
- Verify backend is running and accessible

---

## Additional Resources

- **Vercel Documentation:** https://vercel.com/docs
- **Render Documentation:** https://render.com/docs
- **Project Repository:** https://github.com/RockyBoyRC/SpaceWeirdos
- **Issue Tracker:** https://github.com/RockyBoyRC/SpaceWeirdos/issues
