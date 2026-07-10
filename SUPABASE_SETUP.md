# Supabase Integration Setup Guide

## Overview
This project uses Supabase as the backend database for managing leads and admin dashboard data.

## Required Setup Steps

### 1. Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Open your project
3. Go to **Settings → API**
4. Copy:
   - **Project URL** (e.g., `https://xxxx.supabase.co`)
   - **Anon Public Key** (under `anon` section)

### 2. Update Configuration Files

#### For Local Development:
Create a `.env.local` file in the project root:
```
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

#### For Vercel Deployment:
1. Go to your Vercel project
2. **Settings → Environment Variables**
3. Add:
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your Anon Key

### 3. Update HTML Files

Edit both `index.html` and `admin.html`:

Replace:
```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';
```

With your actual credentials.

### 4. Verify Database Tables

Ensure these tables exist in your Supabase project:

#### `leads` table
```sql
CREATE TABLE leads (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT NOT NULL,
  agent_type TEXT,
  plan TEXT,
  message TEXT,
  status TEXT DEFAULT 'جديد',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Optional: `orders` table
```sql
CREATE TABLE orders (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  lead_id BIGINT REFERENCES leads(id) ON DELETE CASCADE,
  order_date TIMESTAMP DEFAULT NOW(),
  amount DECIMAL(10, 2),
  status TEXT DEFAULT 'pending'
);
```

#### Optional: `profiles` table
```sql
CREATE TABLE profiles (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id TEXT UNIQUE,
  name TEXT,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Optional: `admin_stats` table
```sql
CREATE TABLE admin_stats (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  stat_date DATE DEFAULT CURRENT_DATE,
  total_leads INT DEFAULT 0,
  new_leads INT DEFAULT 0,
  contacted INT DEFAULT 0,
  sold INT DEFAULT 0
);
```

### 5. Row Level Security (RLS)

For production, consider enabling RLS on the `leads` table:

```sql
-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Allow public read/write (for this demo)
CREATE POLICY "Allow public read" ON leads FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON leads FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON leads FOR DELETE USING (true);
```

## API Functions

### Creating a Lead
```javascript
await window.SupabaseAPI.createLead({
  name: 'أحمد',
  company: 'شركة التقنية',
  phone: '0555555555',
  agent_type: 'عميل واتساب',
  plan: 'باقة برو',
  message: 'أريد عميل واتساب',
  status: 'جديد'
});
```

### Getting Leads
```javascript
const { data, total } = await window.SupabaseAPI.getLeads(
  page = 1,
  limit = 100,
  filters = { status: 'جديد', search: 'أحمد' }
);
```

### Updating Lead Status
```javascript
await window.SupabaseAPI.updateLeadStatus(leadId, 'تم التواصل');
```

### Deleting a Lead
```javascript
await window.SupabaseAPI.deleteLead(leadId);
```

### Getting Statistics
```javascript
const stats = await window.SupabaseAPI.getLeadStats();
// Returns: { total, byStatus, byAgentType, byPlan }
```

## Troubleshooting

### Error: "Cannot read property 'createClient' of undefined"
- Supabase SDK not loaded yet
- Solution: Wait for script to load or check CDN link

### Error: "Unauthorized"
- Invalid Anon Key
- Solution: Verify key in Supabase dashboard

### Error: "Relation 'leads' does not exist"
- Table not created
- Solution: Create table using SQL provided above

### CORS Issues
- Supabase should handle CORS automatically
- If issues persist, check Supabase project settings

## Security Notes

⚠️ **Important**: The Anon Key is public and visible in browser code. This is by design for Supabase.

For production:
1. Enable RLS on all tables
2. Create appropriate policies
3. Use JWT tokens for authentication
4. Never expose service role key

## Support

For Supabase issues:
- [Supabase Docs](https://supabase.com/docs)
- [Supabase Community](https://discord.supabase.io)

For project issues:
- Check browser console for errors
- Verify Supabase credentials
- Check network requests in DevTools
