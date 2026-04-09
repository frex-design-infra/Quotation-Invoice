import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://twolywmokxggjnugzuig.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3b2x5d21va3hnZ2pudWd6dWlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NDQ0MzksImV4cCI6MjA5MTEyMDQzOX0.fviTO35D3s3Rqz3VtTVcXdlgESjiO9yz4PRvsxGHVCI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
