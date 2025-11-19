# Deployment Guide

This guide explains how to transform this prototype into a production-ready application and deploy it to **Google Cloud Run** or **Vercel**.

Since the current project uses raw `.tsx` files and browser-based compilation (via import maps), the first step for any production deployment is to set up a standard build pipeline using **Vite**.

## 1. Project Setup (Required for both methods)

Before deploying, you must create the standard configuration files in your project root.

### A. Create `package.json`

Create a file named `package.json` to define dependencies:

```json
{
  "name": "ac-dc-signal-lab",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "recharts": "^2.12.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.18",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.2.2",
    "vite": "^5.1.4"
  }
}
```

### B. Create `vite.config.ts`

Create `vite.config.ts` to configure the build:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
})
```

### C. Create `tsconfig.json`

Create `tsconfig.json` for TypeScript configuration:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["./**/*.ts", "./**/*.tsx"]
}
```

### D. Update `index.html`

You will need to slightly modify `index.html` for the build process. 
1. Remove the `<script type="importmap">` block (dependencies are now in `package.json`).
2. Update the script tag to point to your entry file:
   
   **Change:**
   ```html
   <div id="root"></div>
   ```
   
   **To:**
   ```html
   <div id="root"></div>
   <script type="module" src="/index.tsx"></script>
   ```

---

## 2. Deploy to Google Cloud Run

Google Cloud Run requires a container. We will use Docker.

### Step 1: Create a `Dockerfile`

Create a file named `Dockerfile` in the project root:

```dockerfile
# Build Stage
FROM node:20-alpine as build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

# Production Stage (Nginx)
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config if needed, or use default
# Add specific Nginx config for SPA (Single Page App) routing
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Step 2: Build and Deploy

Run the following commands in your terminal (ensure you have `gcloud` CLI installed and authenticated):

```bash
# 1. Set your project ID
gcloud config set project [YOUR_PROJECT_ID]

# 2. Submit the build to Cloud Build
gcloud builds submit --tag gcr.io/[YOUR_PROJECT_ID]/ac-dc-lab

# 3. Deploy to Cloud Run
gcloud run deploy ac-dc-lab \
  --image gcr.io/[YOUR_PROJECT_ID]/ac-dc-lab \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## 3. Deploy to GitHub via Vercel

Vercel is optimized for frontend frameworks and requires zero configuration if `vite.config.ts` exists.

### Step 1: Push to GitHub

1. Initialize git: `git init`
2. Create a `.gitignore`:
   ```
   node_modules
   dist
   .env
   ```
3. Commit your files:
   ```bash
   git add .
   git commit -m "Initial commit"
   ```
4. Create a repository on GitHub and push your code.

### Step 2: Connect to Vercel

1. Log in to [Vercel](https://vercel.com).
2. Click **"Add New..."** > **"Project"**.
3. Import your GitHub repository.
4. **Framework Preset**: Vercel should automatically detect **Vite**. If not, select it manually.
5. **Build Command**: `npm run build` (default).
6. **Output Directory**: `dist` (default).
7. Click **Deploy**.

Your application will be live in seconds.
