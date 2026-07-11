-- This is just a placeholder, I will execute it via MCP.
UPDATE auth.users SET email_confirmed_at = NOW(), confirmed_at = NOW() WHERE email = 'moha700m@gmail.com';
