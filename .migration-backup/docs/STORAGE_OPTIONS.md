# PDF Storage Options - Free Tier Comparison

When using "Copy Link" to share lesson plans, PDFs need to be stored somewhere. Here are the free options:

## Option 1: Vercel Blob Storage ⭐ (Recommended for Vercel)

**Free Tier:**
- **Storage:** 1 GB/month
- **Simple Operations:** 10,000/month (reads, cache misses)
- **Advanced Operations:** 2,000/month (uploads, copies, lists)
- **Data Transfer:** 10 GB/month

**Pricing After Free Tier:**
- Storage: $0.023/GB/month
- Advanced Operations: $5.00/million
- Data Transfer: $0.050/GB

**Pros:**
- ✅ Native Vercel integration (no external account needed)
- ✅ Automatic token management
- ✅ Easy setup (just create Blob store in Vercel Dashboard)
- ✅ Works seamlessly with Vercel serverless functions

**Cons:**
- ❌ Lower free storage limit (1 GB vs 10 GB for R2)

**Setup:**
1. Go to Vercel Dashboard → Your Project → Storage tab
2. Click "Create Blob Store"
3. Name it (e.g., "lesson-pdfs")
4. The `BLOB_READ_WRITE_TOKEN` is automatically created
5. Redeploy your project

**Current Status:** ✅ Implemented (see `api/generate-pdf.js`)

---

## Option 2: Cloudflare R2 🏆 (Best Free Tier)

**Free Tier:**
- **Storage:** 10 GB/month
- **Uploads (Class A):** 1 million/month
- **Downloads (Class B):** 10 million/month
- **Egress:** FREE (no bandwidth charges!)

**Pricing After Free Tier:**
- Storage: $0.015/GB/month
- Class A Operations: $4.50/million
- Class B Operations: $0.36/million
- Egress: FREE (unlimited!)

**Pros:**
- ✅ **10x more free storage** than Vercel Blob (10 GB vs 1 GB)
- ✅ **FREE egress** (no bandwidth charges - huge savings!)
- ✅ S3-compatible API (easy to switch)
- ✅ Very generous free tier

**Cons:**
- ❌ Requires Cloudflare account setup
- ❌ Need to configure Cloudflare R2 bucket
- ❌ Requires additional environment variables

**Setup:**
1. Create Cloudflare account
2. Go to R2 → Create bucket
3. Name it "lesson-pdfs"
4. Make it public
5. Get API token from Cloudflare Dashboard
6. Add to Vercel environment variables:
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME`
   - `R2_PUBLIC_URL`

**Implementation:** Would need to update `api/generate-pdf.js` to use R2 SDK

---

## Option 3: Supabase Storage (Current)

**Free Tier:**
- **Storage:** 1 GB/month
- **Bandwidth:** Included in free tier

**Pricing After Free Tier:**
- Storage: $0.021/GB/month
- Bandwidth: Standard rates apply

**Pros:**
- ✅ Already configured
- ✅ Works with existing Supabase setup

**Cons:**
- ❌ Same storage limit as Vercel Blob (1 GB)
- ❌ Requires `SUPABASE_SERVICE_ROLE_KEY` (security consideration)

**Current Status:** Currently implemented, but can be switched to Vercel Blob

---

## Recommendation

**For your use case:**
1. **Start with Vercel Blob** - Easiest setup, already integrated, 1 GB free
2. **Upgrade to Cloudflare R2** if you exceed 1 GB/month - 10x more storage, free egress

**Estimated PDF sizes:**
- Average lesson plan PDF: ~200-500 KB
- 1 GB = ~2,000-5,000 PDFs
- 10 GB = ~20,000-50,000 PDFs

For most use cases, **Vercel Blob's 1 GB free tier** should be sufficient unless you're generating thousands of PDFs per month.
