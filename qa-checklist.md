# QA Checklist - Agent Store SaaS

## 1. Authentication
- [ ] **Register**: Create new account with email/password. (PASS/FAIL)
- [ ] **Login**: Access dashboard with valid credentials. (PASS/FAIL)
- [ ] **Logout**: Securely end session and redirect to home. (PASS/FAIL)
- [ ] **Forgot Password**: Receive reset email. (PASS/FAIL)
- [ ] **Reset Password**: Update password via secure link. (PASS/FAIL)
- [ ] **Email Verification**: (If enabled in Supabase) Verify email. (PASS/FAIL)

## 2. User Dashboard
- [ ] **Welcome Message**: Displays user's full name. (PASS/FAIL)
- [ ] **Leads List**: Shows only the user's own leads. (PASS/FAIL)
- [ ] **Profile Update**: Change name, company, phone. (PASS/FAIL)
- [ ] **Bank Transfer Upload**: Upload receipt and see pending status. (PASS/FAIL)

## 3. Support Dashboard (Admin)
- [ ] **Access Control**: Only admin/staff can enter /support/dashboard. (PASS/FAIL)
- [ ] **Leads Management**: View all leads from all users. (PASS/FAIL)
- [ ] **Transfer Review**: View, approve, or reject bank transfers. (PASS/FAIL)

## 4. Database & Security
- [ ] **RLS Policies**: No recursion, users only see their own data. (PASS/FAIL)
- [ ] **Environment Variables**: No hardcoded keys in the code. (PASS/FAIL)

## 5. Build & Performance
- [ ] **Production Build**: `npm run build` or equivalent success. (PASS/FAIL)
- [ ] **Vercel Deployment**: Configured for Vercel. (PASS/FAIL)
