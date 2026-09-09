import { createClient } from "@supabase/supabase-js";

// Public values (the anon key is designed to be public; RLS guards the data). Env vars override.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://udeivbgtpfccbtstvsxa.supabase.co";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkZWl2Ymd0cGZjY2J0c3R2c3hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NjU0ODksImV4cCI6MjEwNDU0MTQ4OX0._MA9g87gg-NQQljdctJKdsIiEu8q-f2V8jXKIOijxS8";

/** Read-only client (anon key, RLS: published content only). Safe on the server and the client. */
export const supabase = createClient(url, anon, { auth: { persistSession: false } });

/** Server-only client with the service role key. Used by API routes (orders, subscribers). Never import in client components. */
export function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(url, key, { auth: { persistSession: false } });
}

export const MEDIA_BASE = `${url}/storage/v1/object/public/media`;
/** shopify://shop_images/<name> -> public storage URL. Settings were rewritten at import, this is for stragglers. */
export const shopImage = (name: string) => `${MEDIA_BASE}/files/${name}`;
