// service_role: bypassa RLS. SOLO servidor. JAMÁS importar desde código de cliente.
import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/supabase";

export function createAdminClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
