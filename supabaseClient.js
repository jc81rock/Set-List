import { createClient } from 'https://esm.sh/@supabase/supabase-js';

// Substitua as strings abaixo com os dados reais do seu painel do Supabase
// Encontrados em: Project Settings -> API
const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
const SUPABASE_ANON_KEY = 'SUA_CHAVE_ANON_AQUI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
