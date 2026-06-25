import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://nqvugwraqtcupntaujzn.supabase.co';
const SUPABASE_ANON_KEY = 'COLE_AQUI_A_CHAVE_PUBLICAVEL_DO_PROJETO_NOVO';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
