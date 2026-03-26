import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tnyvaphdearghqxlwgmh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRueXZhcGhkZWFyZ2hxeGx3Z21oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0OTU2OTAsImV4cCI6MjA5MDA3MTY5MH0.SjflWzQ-n-x8-UWV6XiGvgJcc820yN_D7Ep8rNuX7Cs';
export const supabase = createClient(supabaseUrl, supabaseKey);
