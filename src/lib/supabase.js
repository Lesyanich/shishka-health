import { createClient } from "@supabase/supabase-js";

/*
  Connection config.

  Environment variables take priority (set VITE_SUPABASE_URL /
  VITE_SUPABASE_ANON_KEY in Vercel for the cleanest setup). When they are not
  present — e.g. a preview deploy without env vars — we fall back to the
  project's PUBLIC values below so the live site still reads the real menu.

  These are safe to commit: the anon key is a public, browser-facing key (it
  ships in the client bundle of any deployment) and is restricted by row-level
  security to READ-ONLY access on the public menu tables. It grants no write
  access and no service-role privileges.
*/
const FALLBACK_URL = "https://qcqgtcsjoacuktcewpvo.supabase.co";
const FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjcWd0Y3Nqb2FjdWt0Y2V3cHZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MTYwMjUsImV4cCI6MjA4ODE5MjAyNX0.XI08SHEUG6_DQHyrZIUOtgCtEPW8E7tRTtH2Sc0dqzA";

const key = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;

/*
  In production the browser must NOT hit Supabase's host directly: it sits behind
  Cloudflare, which Russian ISPs throttle, so REST calls hang and the menu never
  loads. Instead we route every call through the site's own Vercel domain —
  `/sb/*` is reverse-proxied to Supabase in vercel.json — so guests only ever
  connect to Vercel (reachable from Russia). Local dev talks to Supabase straight
  (VITE_SUPABASE_URL override, or the public fallback).
*/
const proxied = import.meta.env.PROD && typeof window !== "undefined";
const url = proxied
  ? `${window.location.origin}/sb`
  : import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;

export const supabase = url && key ? createClient(url, key) : null;
export const hasSupabase = Boolean(supabase);
// Realtime is a WebSocket — it can't ride the HTTP reverse-proxy, so it's only
// available on a direct connection (dev). In proxied production the menu still
// loads over REST; it just won't live-update without a refresh (already the case
// in Russia, where the realtime socket is throttled too).
export const canRealtime = hasSupabase && !proxied;
