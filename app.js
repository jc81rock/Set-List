import { supabase } from './supabaseClient.js';

// --- GERENCIADOR DE ABAS GLOBAL ---
window.switchTab = function(tabId) {
    // Esconde todas as seções
    document.querySelectorAll('main > section').forEach(sec => sec.classList.add('hidden'));
    
    // Mostra a seção desejada
    const targetSection = document.getElementById(`tab-${tabId}`);
    if (targetSection) targetSection.classList.remove('hidden');

    // Atualiza a classe visual dos botões no menu lateral
    document.querySelectorAll('#main-nav button').forEach(btn => {
        if(btn.getAttribute('data-tab') === tabId) {
            btn.className = "w-full text-left px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 bg-brand text-white shadow-sm";
        } else {
            btn.className = "w-full text-left px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100";
        }
    });
    
    // Força o carregamento dos dados relativos à aba aberta
    if (tabId === 'dashboard') carregarDashboard();
    if (tabId === 'bandas') listarBandas();
    if (tabId === 'integrantes') { carregarSelectsBandas(); listarIntegrantes(); }
    if (tabId === 'musicas') window.listarMusicas();
    if (tabId === 'repertorios') { carregarSelectsBandas(); listarRepertorios(); }
    if (tabId === 'eventos') { carregarSelectsBandas(); carregarSelectsRepertorios(); listarEventos(); }
}

// Expõe também as funções secundárias de limpeza para o escopo global
window.limparFormBanda = function() { document.getElementById('form-banda').reset(); document.getElementById('banda-id').value = ''; };
window.limparFormIntegrante = function() { document.getElementById('form-integrante').reset(); document.getElementById('integrante-id').value = ''; };
window.limparFormMusica = function() { document.getElementById('form-musica').reset(); document.getElementById('musica-id').value = ''; };
window.limparFormEvento = function() { document.getElementById('form-evento').reset(); document.getElementById('evento-id').value = ''; };
