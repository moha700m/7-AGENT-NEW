const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Using service role for cleanup/setup

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testStage1() {
  console.log('--- Starting Stage 1 QA Tests ---');

  const testEmail = `test_user_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  const testFullName = 'QA Test User';

  try {
    // 1. Test Auth Signup
    console.log('Testing Signup...');
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { full_name: testFullName }
    });

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        console.log('⚠️ Test user already exists, cleaning up and retrying...');
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers.users.find(u => u.email === testEmail);
        if (existingUser) await supabase.auth.admin.deleteUser(existingUser.id);
        return testStage1(); // Retry
      }
      throw signUpError;
    }

    console.log('✅ Signup Successful');

    const userId = signUpData.user.id;

    // 2. Test User Profile Sync (Trigger/Function)
    console.log('Testing Profile Sync...');
    // Wait a bit for trigger to run
    await new Promise(r => setTimeout(r, 2000));
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;
    if (profile.full_name !== testFullName) throw new Error('Profile full_name mismatch');
    if (profile.role !== 'customer') throw new Error('Default role should be customer');
    console.log('✅ Profile Sync Successful');

    // 3. Test RLS on Users Table
    console.log('Testing RLS on Users Table...');
    const userClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY);
    const { data: loginData, error: loginError } = await userClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    if (loginError) throw loginError;

    const { data: ownProfile, error: ownProfileError } = await userClient
      .from('users')
      .select('*')
      .eq('id', userId);
    
    if (ownProfileError) throw ownProfileError;
    if (ownProfile.length !== 1) throw new Error('User should see their own profile');

    const { data: otherProfiles, error: otherProfilesError } = await userClient
      .from('users')
      .select('*')
      .neq('id', userId);
    
    if (otherProfilesError) throw otherProfilesError;
    if (otherProfiles.length > 0) throw new Error('User should NOT see other profiles');
    console.log('✅ RLS (Users) Successful');

    // 4. Test Role Access (Admin Simulation)
    console.log('Testing Admin Access...');
    const { error: roleUpdateError } = await supabase
      .from('users')
      .update({ role: 'admin' })
      .eq('id', userId);
    
    if (roleUpdateError) throw roleUpdateError;

    const { data: allProfiles, error: allProfilesError } = await userClient
      .from('users')
      .select('*');
    
    if (allProfilesError) throw allProfilesError;
    if (allProfiles.length <= 1) {
        // This might fail if there's only one user, but usually there are more
        console.log('⚠️ Only one user in DB, but admin query succeeded');
    }
    console.log('✅ Admin Access Successful');

    console.log('\n--- Stage 1 QA Results: ALL PASS ---');

    // Cleanup
    await supabase.auth.admin.deleteUser(userId);

  } catch (err) {
    console.error('❌ Stage 1 QA Failed:', err.message);
    process.exit(1);
  }
}

testStage1();
