# Secure mobile intake bridge

The migration creates one authenticated table for cross-device phone intake.
Row-level security limits each signed-in user to their own records. There is no
delete policy and no anonymous access.

The migration is ready to apply after the Supabase project is selected. The PWA
must then receive the project's public URL and public anon/publishable key;
service-role keys and private documents must never be placed in this repository.
