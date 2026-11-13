import { createClient } from '@supabase/supabase-js'
import {getSupabaseConfigStatus} from './configStatus.js'
import {projectUrl,publishableKey} from './publicSupabaseConfig.js'
const url = import.meta.env.VITE_SUPABASE_URL||projectUrl
const key = import.meta.env.VITE_SUPABASE_ANON_KEY||publishableKey
export const configured = getSupabaseConfigStatus(url,key).ready
export const supabase = configured ? createClient(url, key, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
}) : null
export function must(result) {
  if (result.error) throw result.error
  return result.data
}
