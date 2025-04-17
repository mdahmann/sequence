Supabase Updates Recommendation:
Implement RLS: Add the Row Level Security policies to your database tables (sequences, sequence_phases, sequence_poses) as discussed previously.
Fix Server Client: Create the helper function for the cookie-based Supabase server client (createServerClient from @supabase/ssr).
Update API Route (GET): Modify the existing GET handler in /app/api/sequences/[id]/route.ts to use this new cookie-based client so it correctly fetches data based on RLS.
Implement API Route (PUT/PATCH): Add a PUT or PATCH handler to /app/api/sequences/[id]/route.ts. This handler must use the cookie-based client, get the user from the session, parse the updated sequence data from the request body, and perform the necessary UPDATE operations on the sequences, sequence_phases, and sequence_poses tables. The RLS policies will ensure the user can only update their own data.
Update handleSave: Modify the handleSave function in app/edit/[id]/page.tsx to make a fetch request (calling the new PUT/PATCH endpoint) instead of saving to localStorage.
This sequence of steps will create a secure and functional way to save edits back to your database.