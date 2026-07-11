const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function testRLS() {
  console.log('Testing RLS policies...');
  
  // 1. Test Leads - Public Insert
  const { data: leadData, error: leadError } = await supabase.from('leads').insert({
    name: 'RLS Test Lead',
    phone: '123456789',
    message: 'Testing public insert'
  }).select();
  
  if (leadError) console.error('❌ Lead Public Insert FAIL:', leadError.message);
  else console.log('✅ Lead Public Insert PASS');

  // 2. Test Agents - Public Select (Published only)
  const { data: agentData, error: agentError } = await supabase.from('agents').select('*');
  if (agentError) console.error('❌ Agent Public Select FAIL:', agentError.message);
  else {
    const allPublished = agentData.every(a => a.is_published);
    if (allPublished) console.log('✅ Agent Public Select (Published only) PASS');
    else console.error('❌ Agent Public Select (Unpublished visible) FAIL');
  }

  // 3. Test Users - Public Select (Should fail/be empty)
  const { data: userData, error: userError } = await supabase.from('users').select('*');
  if (userError) console.log('✅ User Public Select (Denied) PASS:', userError.message);
  else if (userData.length === 0) console.log('✅ User Public Select (Empty) PASS');
  else console.error('❌ User Public Select (Data leaked) FAIL');
}

testRLS();
