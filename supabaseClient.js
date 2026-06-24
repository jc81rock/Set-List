import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://ioedqcnxjlrwpiuqdvgt.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_lT1wveNVSr3jWDLcxyW0og_iiD1EBCu';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
