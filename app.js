import { supabase } from './supabaseClient.js';

// --- GERENCIADOR DE ABAS GLOBAL ---
window.switchTab = function(tabId) {
    // 1. Esconde todas as seções/abas do site
    document.querySelectorAll('main > section').forEach(sec => {
        sec.classList.add('hidden');
    });
    
    // 2. Mostra apenas a seção clicada
    const targetSection = document.getElementById(`tab-${tabId}`);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }

    // 3. Atualiza os estilos visuais dos botões do menu lateral (Ativo vs Inativo)
    document.querySelectorAll('#main-nav button').forEach(btn => {
        if (btn.getAttribute('data-tab') === tabId) {
            // Estilo do botão Ativo (Destaque Vermelho Brand)
            btn.className = "w-full text-left px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 bg-brand text-white shadow-sm";
        } else {
            // Estilo do botão Inativo (Cinza discreto)
            btn.className = "w-full text-left px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100";
        }
    });
    
    // 4. Executa as funções de carregamento de dados do banco conforme a aba aberta
    if (tabId === 'dashboard') {
        if (typeof carregarDashboard === 'function') carregarDashboard();
    }
    if (tabId === 'bandas') {
        if (typeof listarBandas === 'function') listarBandas();
    }
    if (tabId === 'integrantes') {
        if (typeof carregarSelectsBandas === 'function') carregarSelectsBandas();
        if (typeof listarIntegrantes === 'function') listarIntegrantes();
    }
    if (tabId === 'musicas') {
        if (typeof window.listarMusicas === 'function') window.listarMusicas();
    }
    if (tabId === 'repertorios') {
        if (typeof carregarSelectsBandas === 'function') carregarSelectsBandas();
        if (typeof listarRepertorios === 'function') listarRepertorios();
    }
    if (tabId === 'eventos') {
        if (typeof carregarSelectsBandas === 'function') carregarSelectsBandas();
        if (typeof carregarSelectsRepertorios === 'function') carregarSelectsRepertorios();
        if (typeof listarEventos === 'function') listarEventos();
    }
}

// --- EXPOSIÇÃO DAS FUNÇÕES DE LIMPEZA PARA O ESCOPO GLOBAL ---
window.limparFormBanda = function() { document.getElementById('form-banda').reset(); document.getElementById('banda-id').value = ''; };
window.limparFormIntegrante = function() { document.getElementById('form-integrante').reset(); document.getElementById('integrante-id').value = ''; };
window.limparFormMusica = function() { document.getElementById('form-musica').reset(); document.getElementById('musica-id').value = ''; };
window.limparFormEvento = function() { document.getElementById('form-evento').reset(); document.getElementById('evento-id').value = ''; };
