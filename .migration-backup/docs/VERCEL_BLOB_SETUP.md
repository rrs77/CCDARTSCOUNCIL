# Vercel Blob Storage Setup Guide

This guide explains how to set up Vercel Blob Storage for PDF sharing (replacing Supabase Storage).

## Free Tier Limits

**Vercel Blob Storage Free Tier:**
- ✅ **Storage:** 1 GB/month
- ✅ **Simple Operations:** 10,000/month (reads, cache misses)
- ✅ **Advanced Operations:** 2,000/month (uploads, copies, lists)
- ✅ **Data Transfer:** 10 GB/month

**Pricing After Free Tier:**
- Storage: $0.023/GB/month
- Advanced Operations: $5.00/million
- Data Transfer: $0.050/GB

## Setup Steps

### 1. Create Blob Store in Vercel

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project
3. Click on **Storage** tab (in the top navigation)
4. Click **Create Blob Store**
5. Name it (e.g., `lesson-pdfs` or leave default)
6. Click **Create**

**Important:** The `BLOB_READ_WRITE_TOKEN` environment variable is **automatically created** by Vercel when you create a Blob store. You don't need to set it manually!

### 2. Redeploy Your Project

After creating the Blob store, redeploy your project so the API route can access the token:

1. Go to **Deployments** tab
2. Click **...** on the latest deployment
3. Click **Redeploy**

Or simply push a new commit to trigger automatic deployment.

### 3. Verify Setup

1. Test the "Copy Link" functionality in your app
2. Check Vercel function logs: **Deployments** → **Functions** → `api/generate-pdf`
3. Check Storage: **Storage** tab → Your Blob store → Files

## How It Works

1. User clicks "Copy Link" on a lesson plan
2. PDF is generated using PDFBolt API
3. PDF is uploaded to **Vercel Blob Storage** (not Supabase)
4. Public URL is returned and copied to clipboard
5. URL is stored in localStorage for reuse

## Migration from Supabase Storage

The code has been updated to use Vercel Blob instead of Supabase Storage. You no longer need:
- ❌ `SUPABASE_SERVICE_ROLE_KEY` (for PDF storage)
- ✅ Still need Supabase for your database (lessons, activities, etc.)

## Troubleshooting

**Error: "BLOB_READ_WRITE_TOKEN not found"**
- Ensure you've created a Blob store in Vercel Dashboard
- Redeploy your project after creating the store
- Check that the token appears in **Settings** → **Environment Variables**

**Error: "Upload to Vercel Blob failed"**
- Check Vercel function logs for detailed error messages
- Verify the Blob store exists and is accessible
- Ensure you haven't exceeded free tier limits (2,000 uploads/month)

## Storage Usage

**Estimated PDF sizes:**
- Average lesson plan: ~200-500 KB
- 1 GB = ~2,000-5,000 PDFs
- Free tier should handle ~2,000 PDFs/month

**Monitor Usage:**
- Vercel Dashboard → **Storage** → Your Blob store → **Usage**

## Alternative: Cloudflare R2 (More Free Storage)

If you need more than 1 GB/month, consider **Cloudflare R2**:
- **10 GB/month free** (10x more!)
- **1 million uploads/month free**
- **FREE egress** (no bandwidth charges)

See `docs/STORAGE_OPTIONS.md` for comparison and setup instructions.
