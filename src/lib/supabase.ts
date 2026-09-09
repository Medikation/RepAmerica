import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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
