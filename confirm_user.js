const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient('https://pfrugircpdwrxmfikfhv.supabase.co', 'sb_secret_IakXGNQymg7awch3aiC6hg_M96A39');

async function confirmUser(email) {
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  const user = users.find(u => u.email === email);
  if (!user) {
    console.error('User not found');
    return;
  }

  const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
    email_confirm: true
  });

  if (error) {
    console.error('Error confirming user:', error);
  } else {
    console.log('User confirmed successfully:', data.user.email);
  }
}

confirmUser('moha700m@gmail.com');
