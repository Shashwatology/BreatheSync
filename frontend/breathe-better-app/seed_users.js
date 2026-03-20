import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://uwmozmfkpjamvmlivavn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3bW96bWZrcGphbXZtbGl2YXZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NTQwMTAsImV4cCI6MjA4NzQzMDAxMH0.CUUYXTvLpdxoBsNxo4eadzXaXuMeyWpAMqVMFSLcmtQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const users = [
  { email: 'sargam@breathysync.com', password: 'Password123!', full_name: 'Sargam', role: 'admin' },
  { email: 'shashwat@breathysync.com', password: 'Password123!', full_name: 'Shashwat', role: 'admin' },
  { email: 'arav@breathysync.com', password: 'Password123!', full_name: 'Arav Sharma', role: 'patient', phone: '+919876543210' },
  { email: 'anya@breathysync.com', password: 'Password123!', full_name: 'Anya Patel', role: 'patient', phone: '+919876543211' },
  { email: 'rohan@breathysync.com', password: 'Password123!', full_name: 'Rohan Gupta', role: 'patient', phone: '+919876543212' },
  { email: 'diya@breathysync.com', password: 'Password123!', full_name: 'Diya Verma', role: 'patient', phone: '+919876543213' },
  { email: 'karan@breathysync.com', password: 'Password123!', full_name: 'Karan Singh', role: 'patient', phone: '+919876543214' }
];

async function seed() {
  console.log("Starting user creation...");
  for (const u of users) {
    console.log(`\nCreating user: ${u.email}`);
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: u.email,
      password: u.password,
      options: {
        data: {
          full_name: u.full_name,
        }
      }
    });

    if (authError) {
       console.error("Auth Error for " + u.email + ":", authError.message);
       continue;
    } 
    
    console.log("Successfully signed up " + u.email);
    
    if (authData.user) {
        // Update profile
        const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: u.role, full_name: u.full_name })
        .eq('user_id', authData.user.id);
        
        if (profileError) {
            console.error("Profile update error for " + u.email + ":", profileError.message);
        } else {
            console.log("Profile successfully updated for " + u.email + " with role " + u.role);
        }
    }
  }
  console.log("\nFinished seeding users.");
}

seed();
