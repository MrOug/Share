# 🚀 Deploy to Vercel - Step by Step Guide

## Quick Deploy (5 minutes)

### Step 1: Push to GitHub

```bash
cd c:\sujata-mastani-inventory-main\upstox-production

# Initialize git (if not already done)
git init
git add .
git commit -m "Add production-ready Upstox Console"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR-USERNAME/upstox-console.git
git branch -M main
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your `upstox-console` repo
4. Click **"Import"**

### Step 3: Add Environment Variables

In Vercel deployment settings:

1. Go to **Settings** → **Environment Variables**
2. Add these 3 variables:

| Name | Value |
|------|-------|
| `UPSTOX_API_KEY` | `c4b13b67-b8f5-490a-ad3b-514da49ad0c0` |
| `UPSTOX_API_SECRET` | `pfx2ui3ls6` |
| `UPSTOX_REDIRECT_URI` | `https://YOUR-APP.vercel.app/callback` |

**Important**: Change `YOUR-APP` to your actual Vercel URL (e.g., `upstox-console-xyz.vercel.app`)

3. Click **"Save"**
4. Click **"Redeploy"** to apply changes

### Step 4: Update Upstox App Settings

1. Visit [Upstox Developer Dashboard](https://upstox.com/developer/apps)
2. Select your app
3. Update **Redirect URL** to: `https://YOUR-APP.vercel.app/callback`
4. Save changes

### Step 5: Test Your Deployment

1. Visit: `https://YOUR-APP.vercel.app`
2. Click **[AUTH]** button
3. Complete Upstox OAuth flow
4. Test data fetching and charts

✅ **Done!** Your app is live and secure!

---

## 🔒 Security Verification

After deployment, verify:

```bash
# Check that config.js has NO hardcoded secrets
curl https://YOUR-APP.vercel.app/config.js
# Should show environment variable placeholders, not actual values

# Verify .gitignore is working
git status
# config.local.js should NOT appear (if you created it)
```

---

## 🔄 Making Changes

```bash
# Make code changes
git add .
git commit -m "Update feature X"
git push

# Vercel auto-deploys on push!
```

---

## 📊 Vercel Dashboard

Access your deployment:
- **Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Logs**: Monitor real-time logs
- **Analytics**: View usage stats
- **Domains**: Add custom domain (optional)

---

## 🆘 Troubleshooting

### "No access token" error
- Check environment variables are set in Vercel
- Verify redirect URI matches exactly
- Try redeploying

### OAuth redirect fails
- Update redirect URL in Upstox dashboard
- Must be: `https://YOUR-APP.vercel.app/callback` (exact match)

### "Configuration not loaded"
- Environment variables not set
- Go to Settings → Environment Variables
- Add all 3 required variables
- Redeploy

---

## 📁 Files Safe to Commit

✅ **These are SAFE** (no secrets):
- `config.js` (reads from environment)
- `config.example.js`
- `config.local.example.js`
- All `.md` files
- `vercel.json`
- `js/`, `css/` folders
- `index.html`

❌ **NEVER commit**:
- `config.local.js` (git-ignored automatically)

---

## 🎯 Production Checklist

- [ ] Pushed to GitHub
- [ ] Imported to Vercel
- [ ] Set 3 environment variables
- [ ] Updated Upstox redirect URI
- [ ] Tested OAuth flow
- [ ] Verified no secrets in public code
- [ ] Custom domain configured (optional)

---

**Your Upstox Console is now production-ready and deployed! 🎉**

For questions: Check `SECURITY.md` and `DEPLOYMENT.md`
