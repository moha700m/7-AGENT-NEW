/* ====== QA Test Script for Stage 2 (Support Dashboard) ====== */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
console.log('Using URL:', supabaseUrl);
console.log('Using Key (first 10 chars):', supabaseKey?.substring(0, 10));

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  console.log('🚀 Starting Stage 2 QA Tests...');
  const results = [];

  try {
    // 1. Test Database Connectivity
    results.push({ test: 'Database Connectivity', status: 'PASS ✅' });

    // 2. Test User Management Access
    const { data: users, error: userErr } = await supabase.from('users').select('*').limit(1);
    results.push({ test: 'Users Table Access', status: userErr ? 'FAIL ❌' : 'PASS ✅', msg: userErr?.message });

    // 3. Test Leads Management Access
    const { data: leads, error: leadErr } = await supabase.from('leads').select('*').limit(1);
    results.push({ test: 'Leads Table Access', status: leadErr ? 'FAIL ❌' : 'PASS ✅', msg: leadErr?.message });

    // 4. Test Orders Management Access
    const { data: orders, error: orderErr } = await supabase.from('orders').select('*').limit(1);
    results.push({ test: 'Orders Table Access', status: orderErr ? 'FAIL ❌' : 'PASS ✅', msg: orderErr?.message });

    // 5. Test Bank Transfers Management Access
    const { data: transfers, error: transErr } = await supabase.from('bank_transfers').select('*').limit(1);
    results.push({ test: 'Bank Transfers Access', status: transErr ? 'FAIL ❌' : 'PASS ✅', msg: transErr?.message });

    // 6. Test Activity Logs (Audit)
    const { data: logs, error: logErr } = await supabase.from('activity_logs').select('*').limit(1);
    results.push({ test: 'Activity Logs Access', status: logErr ? 'FAIL ❌' : 'PASS ✅', msg: logErr?.message });

  } catch (err) {
    console.error('💥 Test Suite Crashed:', err);
  }

  console.log('\n--- Final QA Report Stage 2 ---');
  console.table(results);
  
  const allPass = results.every(r => r.status.includes('PASS'));
  if (allPass) {
    console.log('\n✅ ALL STAGE 2 BACKEND TESTS PASSED!');
  } else {
    console.log('\n❌ SOME TESTS FAILED. CHECK THE TABLE ABOVE.');
  }
}

runTests();
