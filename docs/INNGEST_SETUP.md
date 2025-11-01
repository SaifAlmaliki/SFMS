# Inngest Setup Guide

This guide explains how to set up Inngest for the AI Firewall Agent application.

## Option 1: Inngest Cloud (Recommended for Production)

### Step 1: Sign Up for Inngest Cloud

1. Go to [https://www.inngest.com](https://www.inngest.com)
2. Click "Sign Up" or "Get Started"
3. Create a free account (free tier includes generous limits)

### Step 2: Create an App

1. After signing in, navigate to your dashboard
2. Create a new app (or use the default app)
3. Note your **App ID** (used as `id` in the Inngest client)

### Step 3: Get Your Event Key

1. In your Inngest dashboard, go to **Settings** → **Keys**
2. Find your **Event Key** (also called "Event Signing Key")
3. Copy the Event Key value

**OR** if you're using Inngest Cloud, you can also use the **Event API Key**:
- Go to **Settings** → **API Keys**
- Create a new API key or use an existing one
- This is used as your `INNGEST_EVENT_KEY`

### Step 4: Get Your Signing Key

1. In your Inngest dashboard, go to **Settings** → **Keys**
2. Find your **Signing Key**
3. Copy the Signing Key value
4. This is used as your `INNGEST_SIGNING_KEY`

### Step 5: Configure Environment Variables

Create a `.env` file in the project root (if it doesn't exist) and add:

```bash
# Inngest Configuration
INNGEST_EVENT_KEY=your_event_key_from_step_3
INNGEST_SIGNING_KEY=your_signing_key_from_step_4
NEXT_PUBLIC_BASE_URL=http://localhost:9002

# Optional: If using Inngest Cloud, you may also need:
# INNGEST_BASE_URL=https://api.inngest.com
```

**Important Notes:**
- The Event Key is used to send events to Inngest
- The Signing Key is used to verify webhook requests from Inngest
- For local development, use `http://localhost:9002` as your base URL
- For production, use your actual domain (e.g., `https://your-domain.com`)

## Option 2: Inngest Dev Server (Recommended for Local Development)

For local development, you can use the Inngest Dev Server which doesn't require API keys:

### Step 1: Install Inngest CLI

```bash
npm install -g inngest-cli
```

Or use npx:

```bash
npx inngest-cli@latest dev
```

### Step 2: Start the Dev Server

In a separate terminal, run:

```bash
npx inngest-cli@latest dev
```

This will:
- Start a local Inngest server (usually on `http://localhost:8288`)
- Provide a web UI at `http://localhost:8288`
- Automatically discover and register your Inngest functions

### Step 3: Configure Environment Variables

For local dev server, you can use:

```bash
# Inngest Dev Server Configuration (no keys needed)
INNGEST_EVENT_KEY=local
INNGEST_SIGNING_KEY=local
NEXT_PUBLIC_BASE_URL=http://localhost:9002

# Optional: Point to local dev server
# INNGEST_BASE_URL=http://localhost:8288
```

Or simply leave them empty/unset if your code handles it gracefully.

## Troubleshooting

### Error: "401 Event key not found"

This means your `INNGEST_EVENT_KEY` is either:
- Not set in your `.env` file
- Set incorrectly
- Using a key from the wrong Inngest app

**Solutions:**
1. Verify your `.env` file exists in the project root
2. Check that `INNGEST_EVENT_KEY` is set correctly
3. Restart your Next.js dev server after updating `.env`
4. If using Inngest Cloud, verify the key in your dashboard

### Testing Your Setup

1. Start your Next.js app: `npm run dev`
2. Start Inngest Dev Server (if using local): `npx inngest-cli@latest dev`
3. Check your Inngest dashboard or dev server UI
4. Try approving a ticket in the admin panel - it should trigger the deployment function

### Additional Resources

- [Inngest Documentation](https://www.inngest.com/docs)
- [Inngest Quick Start](https://www.inngest.com/docs/quick-start)
- [Inngest Local Development](https://www.inngest.com/docs/local-development)

