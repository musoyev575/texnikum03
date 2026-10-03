// =========================================================
// 1-SON TEXNIKUMI — SUPABASE ULANISH SOZLAMALARI
// =========================================================

const SUPABASE_URL = "https://xyqekttjeuhynupjrjhk.supabase.co";
const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5cWVrdHRqZXVoeW51cGpyamhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MTMyNTgsImV4cCI6MjEwNTE4OTI1OH0.w1zO6hU8uAjvOqagEnZzMx7KOHSYwnSx_vMfE4nygHI";

// Global Supabase client (supabase-js kutubxonasi index.html/news.html/
// courses.html/admin.html sahifalariga CDN orqali ulanadi)
const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);
