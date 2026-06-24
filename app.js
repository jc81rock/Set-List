import { supabase } from './supabaseClient.js';

// --- GERENCIADOR DE ABAS ---
window.switchTab = function(tabId) {
    document.querySelectorAll('main > section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');

    document.querySelectorAll('#main-nav button').forEach(btn => {
        if(btn.getAttribute('data-tab') === tabId) {
            btn.className = "w-full text-left px-4 py-2.5 rounded-lg font-medium transition bg-brand text-white";
        } else {
            btn.className = "w-full text-left px-4 py-2.5 rounded-lg font-medium transition text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200";
        }
    });
    
    // Atualiza os dados sempre que entra na aba correspondente
    if (tabId === 'dashboard') carregarDashboard();
    if (tabId === 'bandas') listarBandas();
    if (tabId === 'integrantes') { carregarSelectsBandas(); listarIntegrantes(); }
    if (tabId === 'musicas') listarMusicas();
    if (tabId === 'repertorios') { carregarSelectsBandas(); listarRepertorios(); }
    if (tabId === 'eventos') { carregarSelectsBandas(); carregarSelectsRepertorios(); listarEventos(); }
}

let repertorioAtivoId = null;

// --- INITIAL LOAD ---
async function init() {
    carregarDashboard();
}

// --- ABA 1: DASHBOARD ---
async function carregarDashboard() {
    const { count: cB } = await supabase.from('bandas').select('*', { count: 'exact', head: true });
    const { count: cI } = await supabase.from('integrantes').select('*', { count: 'exact', head: true });
    const { count: cM } = await supabase.from('musicas').select('*', { count: 'exact', head: true });
    const { count: cR } = await supabase.from('repertorios').select('*', { count: 'exact', head: true });

    document.getElementById('dash-bandas').innerText = cB || 0;
    document.getElementById('dash-integrantes').innerText = cI || 0;
    document.getElementById('dash-musicas').innerText = cM || 0;
    document.getElementById('dash-repertorios').innerText = cR || 0;

    const { data: eventos } = await supabase.from('eventos').select('*').order('data_evento', { ascending: true }).limit(5);
    const tbody = document.getElementById('dash-lista-eventos');
    tbody.innerHTML = '';
    
    if(eventos && eventos.length > 0) {
        eventos.forEach(ev => {
            tbody.innerHTML += `
                <tr class="hover:bg-zinc-900/40 transition">
                    <td class="py-3 px-4 font-medium text-zinc-200">${ev.nome}</td>
                    <td class="py-3 px-4 text-zinc-400">${ev.local}</td>
                    <td class="py-3 px-4 text-zinc-400">${new Date(ev.data_evento).toLocaleDateString('pt-BR')}</td>
                </tr>`;
        });
    } else {
        tbody.innerHTML = `<tr><td colspan="3" class="py-4 px-4 text-zinc-500 italic">Nenhum evento agendado.</td></tr>`;
    }
}

// --- UTILS: CARREGAR SELECTS ---
async function carregarSelectsBandas() {
    const { data } = await supabase.from('bandas').select('id, nome');
    const options = data ? data.map(b => `<option value="${b.id}">${b.nome}</option>`).join('') : '';
    
    ['integrante-banda-id', 'repertorio-banda-id', 'evento-banda-id'].forEach(id => {
        const el = document.getElementById(id);
        if(el) el.innerHTML = options;
    });
}

async function carregarSelectsRepertorios() {
    const { data } = await supabase.from('repertorios').select('id, nome');
    const el = document.getElementById('evento-repertorio-id');
    if(el) el.innerHTML = data ? data.map(r => `<option value="${r.id}">${r.nome}</option>`).join('') : '';
}

// --- ABA 2: CRUD BANDAS ---
async function listarBandas() {
    const { data } = await supabase.from('bandas').select('*').order('nome');
    const tbody = document.getElementById('lista-bandas');
    tbody.innerHTML = data ? data.map(b => `
        <tr class="hover:bg-zinc-900/40 transition">
            <td class="py-3 px-4 font-semibold text-zinc-200">${b.nome}</td>
            <td class="py-3 px-4 text-zinc-400">${b.cidade || ''} - ${b.estado || ''}</td>
            <td class="py-3 px-4 text-right space-x-2">
                <button onclick="editarBanda(${b.id}, '${b.nome}', '${b.cidade || ''}', '${b.estado || ''}', '${b.observacoes || ''}')" class="text-zinc-400 hover:text-white">✏️</button>
                <button onclick="deletarBanda(${b.id})" class="text-zinc-500 hover:text-brand">🗑️</button>
            </td>
        </tr>
    `).join('') : '';
}

document.getElementById('form-banda').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('banda-id').value;
    const payload = {
        nome: document.getElementById('banda-nome').value,
        cidade: document.getElementById('banda-cidade').value,
        estado: document.getElementById('banda-estado').value,
        observacoes: document.getElementById('banda-observacoes').value
    };

    if(id) await supabase.from('bandas').update(payload).eq('id', id);
    else await supabase.from('bandas').insert([payload]);
    
    limparFormBanda(); listarBandas();
});

window.editarBanda = function(id, nome, cidade, estado, obs) {
    document.getElementById('banda-id').value = id;
    document.getElementById('banda-nome').value = nome;
    document.getElementById('banda-cidade').value = cidade;
    document.getElementById('banda-estado').value = estado;
    document.getElementById('banda-observacoes').value = obs;
};

window.deletarBanda = function(id) {
    if(confirm('Deseja excluir essa banda?')) {
        supabase.from('bandas').delete().eq('id', id).then(() => listarBandas());
    }
};

window.limparFormBanda = function() {
    document.getElementById('form-banda').reset();
    document.getElementById('banda-id').value = '';
};

// --- ABA 3: CRUD INTEGRANTES ---
async function listarIntegrantes() {
    const { data } = await supabase.from('integrantes').select('*, bandas(nome)').order('nome');
    document.getElementById('lista-integrantes').innerHTML = data ? data.map(i => `
        <tr class="hover:bg-zinc-900/40 transition">
            <td class="py-3 px-4 text-zinc-400">${i.bandas?.nome || 'Sem Banda'}</td>
            <td class="py-3 px-4 font-semibold text-zinc-200">${i.nome}</td>
            <td class="py-3 px-4 text-zinc-300">${i.instrumento}</td>
            <td class="py-3 px-4 text-zinc-400">${i.vocal ? '🎤 Sim' : 'Não'}</td>
            <td class="py-3 px-4 text-right space-x-2">
                <button onclick="editarIntegrante(${i.id}, '${i.banda_id}', '${i.nome}', '${i.instrumento}', ${i.vocal}, '${i.observacoes || ''}')" class="text-zinc-400 hover:text-white">✏️</button>
                <button onclick="deletarIntegrante(${i.id})" class="text-zinc-500 hover:text-brand">🗑️</button>
            </td>
        </tr>
    `).join('') : '';
}

document.getElementById('form-integrante').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('integrante-id').value;
    const payload = {
        banda_id: document.getElementById('integrante-banda-id').value,
        nome: document.getElementById('integrante-nome').value,
        instrumento: document.getElementById('integrante-instrumento').value,
        vocal: document.getElementById('integrante-vocal').checked,
        observacoes: document.getElementById('integrante-observacoes').value
    };

    if(id) await supabase.from('integrantes').update(payload).eq('id', id);
    else await supabase.from('integrantes').insert([payload]);

    limparFormIntegrante(); listarIntegrantes();
});

window.editarIntegrante = function(id, bandaId, nome, inst, vocal, obs) {
    document.getElementById('integrante-id').value = id;
    document.getElementById('integrante-banda-id').value = bandaId;
    document.getElementById('integrante-nome').value = nome;
    document.getElementById('integrante-instrumento').value = inst;
    document.getElementById('integrante-vocal').checked = vocal;
    document.getElementById('integrante-observacoes').value = obs;
};

window.deletarIntegrante = function(id) {
    if(confirm('Remover integrante?')) {
        supabase.from('integrantes').delete().eq('id', id).then(() => listarIntegrantes());
    }
};

window.limparFormIntegrante = function() {
    document.getElementById('form-integrante').reset();
    document.getElementById('integrante-id').value = '';
};

// --- ABA 4: CRUD MÚSICAS ---
window.listarMusicas = async function() {
    const busca = document.getElementById('busca-musica').value;
    const catFiltro = document.getElementById('filtro-categoria').value;
    const ordem = document.getElementById('ordenacao-musica').value;

    let query = supabase.from('musicas').select('*');
    if (busca) query = query.or(`titulo.ilike.%${busca}%,artista.ilike.%${busca}%`);
    if (catFiltro) query = query.eq('categoria', catFiltro);
    query = query.order(ordem, { ascending: true });

    const { data } = await query;
    document.getElementById('lista-musicas').innerHTML = data ? data.map(m => `
        <tr class="hover:bg-zinc-900/40 transition">
            <td class="py-3 px-4 font-semibold text-zinc-200">${m.titulo}</td>
            <td class="py-3 px-4 text-zinc-300">${m.artista}</td>
            <td class="py-3 px-4 text-zinc-400 text-xs">${m.categoria}</td>
            <td class="py-3 px-4 text-brand font-mono">${m.tom}</td>
            <td class="py-3 px-4 font-mono">${m.bpm || '--'}</td>
            <td class="py-3 px-4 font-mono">${m.duracao}</td>
            <td class="py-3 px-4 text-right space-x-2">
                <button onclick="editarMusica(${m.id}, '${m.titulo}', '${m.artista}', '${m.categoria}', '${m.tom}', '${m.bpm || ''}', '${m.duracao}', '${m.observacoes || ''}')" class="text-zinc-400 hover:text-white">✏️</button>
                <button onclick="deletarMusica(${m.id})" class="text-zinc-500 hover:text-brand">🗑️</button>
            </td>
        </tr>
    `).join('') : '';
}

document.getElementById('form-musica').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('musica-id').value;
    const payload = {
        titulo: document.getElementById('musica-titulo').value,
        artista: document.getElementById('musica-artista').value,
        categoria: document.getElementById('musica-categoria').value,
        tom: document.getElementById('musica-tom').value,
        bpm: document.getElementById('musica-bpm').value ? parseInt(document.getElementById('musica-bpm').value) : null,
        duracao: document.getElementById('musica-duracao').value,
        observacoes: document.getElementById('musica-observacoes').value
    };

    if(id) await supabase.from('musicas').update(payload).eq('id', id);
    else await supabase.from('musicas').insert([payload]);

    limparFormMusica(); listarMusicas();
});

window.editarMusica = function(id, t, a, c, tom, bpm, d, obs) {
    document.getElementById('musica-id').value = id;
    document.getElementById('musica-titulo').value = t;
    document.getElementById('musica-artista').value = a;
    document.getElementById('musica-categoria').value = c;
    document.getElementById('musica-tom').value = tom;
    document.getElementById('musica-bpm').value = bpm;
    document.getElementById('musica-duracao').value = d;
    document.getElementById('musica-observacoes').value = obs;
};

window.deletarMusica = function(id) {
    if(confirm('Excluir música permanentemente?')) {
        supabase.from('musicas').delete().eq('id', id).then(() => listarMusicas());
    }
};

window.limparFormMusica = function() {
    document.getElementById('form-musica').reset();
    document.getElementById('musica-id').value = '';
};

// --- ABA 5: REPERTÓRIOS & SET-LISTS ---
async function listarRepertorios() {
    const { data } = await supabase.from('repertorios').select('*, bandas(nome)').order('created_at', { ascending: false });
    document.getElementById('lista-repertorios').innerHTML = data ? data.map(r => `
        <div class="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex justify-between items-center hover:border-zinc-700 transition">
            <div>
                <span class="text-xs uppercase font-bold text-zinc-500">${r.bandas?.nome || 'Sem Banda'}</span>
                <h5 class="text-lg font-bold text-zinc-100">${r.nome}</h5>
                <p class="text-xs text-zinc-400">${r.observacoes || ''}</p>
            </div>
            <div class="flex gap-2">
                <button onclick="abrirGerenciadorRepertorio(${r.id}, '${r.nome}')" class="px-3 py-1.5 bg-brand rounded-lg text-xs font-semibold hover:bg-red-700 transition text-white">⚙️ Montar Set</button>
                <button onclick="deletarRepertorio(${r.id})" class="text-zinc-500 hover:text-brand px-2">🗑️</button>
            </div>
        </div>
    `).join('') : '';
}

document.getElementById('form-repertorio').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        banda_id: document.getElementById('repertorio-banda-id').value,
        nome: document.getElementById('repertorio-nome').value,
        observacoes: document.getElementById('repertorio-observacoes').value
    };
    await supabase.from('repertorios').insert([payload]);
    document.getElementById('form-repertorio').reset();
    listarRepertorios();
});

window.deletarRepertorio = function(id) {
    if(confirm('Excluir este repertório?')) {
        supabase.from('repertorios').delete().eq('id', id).then(() => {
            document.getElementById('gerenciador-musicas-repertorio').classList.add('hidden');
            listarRepertorios();
        });
    }
}

// --- SUB-SISTEMA: DINÂMICA DE MÚSICAS DO REPERTÓRIO ---
window.abrirGerenciadorRepertorio = async function(id, nome) {
    repertorioAtivoId = id;
    document.getElementById('nome-repertorio-ativo').innerText = nome;
    document.getElementById('gerenciador-musicas-repertorio').classList.remove('hidden');
    
    // Rola a tela até o gerenciador para melhorar a experiência
    document.getElementById('gerenciador-musicas-repertorio').scrollIntoView({ behavior: 'smooth' });

    carregarMusicasDisponiveis();
    carregarMusicasDoRepertorio();
}

async function carregarMusicasDisponiveis() {
    const { data } = await supabase.from('musicas').select('*').order('titulo');
    const container = document.getElementById('lista-add-musicas-disponiveis');
    
    container.innerHTML = data ? data.map(m => `
        <div class="flex justify-between items-center p-3 hover:bg-zinc-900 transition text-sm">
            <div>
                <p class="font-semibold text-zinc-200">${m.titulo} <span class="text-xs text-zinc-400">(${m.artista})</span></p>
                <p class="text-xs text-zinc-500">Tom: ${m.tom} | BPM: ${m.bpm || '--'}</p>
            </div>
            <button onclick="adicionarMusicaAoSet(${m.id})" class="text-xs font-bold text-emerald-400 hover:text-emerald-300 font-mono">+ INCLUIR</button>
        </div>
    `).join('') : '';
}

async function carregarMusicasDoRepertorio() {
    const { data } = await supabase.from('repertorio_musicas').select('id, ordem, musicas(*)').eq('repertorio_id', repertorioAtivoId).order('ordem');
    const container = document.getElementById('lista-musicas-do-repertorio');
    
    // Zerando cálculos extras solicitados no roteiro
    let tempoMinutos = 0, tempoSegundos = 0, totalBpm = 0, qtdBpmValidos = 0;

    container.innerHTML = data && data.length > 0 ? data.map((rm, index) => {
        const m = rm.musicas;
        
        // Processa cálculo de duração (Formato MM:SS)
        if(m.duracao && m.duracao.includes(':')) {
            const parts = m.duracao.split(':');
            tempoMinutos += parseInt(parts[0]) || 0;
            tempoSegundos += parseInt(parts[1]) || 0;
        }
        // Processa cálculo de BPM médio
        if(m.bpm) {
            totalBpm += m.bpm;
            qtdBpmValidos++;
        }

        return `
            <div class="bg-zinc-950 p-3 rounded-lg border border-zinc-800 flex justify-between items-center gap-2">
                <div class="flex items-center gap-3">
                    <input type="number" value="${rm.ordem}" onchange="alterarOrdemMusica(${rm.id}, this.value)" class="w-12 bg-zinc-900 border border-zinc-700 text-center text-xs font-bold text-brand rounded py-1">
                    <div>
                        <p class="text-sm font-bold text-zinc-100">${index + 1}. ${m.titulo}</p>
                        <p class="text-xs text-zinc-400">${m.artista} | <span class="text-brand">${m.tom}</span> | ${m.duracao}</p>
                    </div>
                </div>
                <button onclick="removerMusicaDoSet(${rm.id})" class="text-zinc-600 hover:text-brand text-xs">X Remover</button>
            </div>
        `;
    }).join('') : '<p class="text-xs text-zinc-500 italic p-2">Nenhuma música adicionada a esta set-list ainda.</p>';

    // Tratando estouro dos segundos para minutos
    tempoMinutos += Math.floor(tempoSegundos / 60);
    const segundosRestantes = String(tempoSegundos % 60).padStart(2, '0');
    const minutosFormatados = String(tempoMinutos).padStart(2, '0');

    document.getElementById('rep-qtd-musicas').innerText = data ? data.length : 0;
    document.getElementById('rep-tempo-total').innerText = `${minutosFormatados}:${segundosRestantes}`;
    document.getElementById('rep-bpm-medio').innerText = qtdBpmValidos > 0 ? Math.round(totalBpm / qtdBpmValidos) : 0;
}

window.adicionarMusicaAoSet = async function(musicaId) {
    const proximaOrdem = parseInt(document.getElementById('rep-qtd-musicas').innerText) + 1;
    await supabase.from('repertorio_musicas').insert([{
        repertorio_id: repertorioAtivoId,
        musica_id: musicaId,
        ordem: proximaOrdem
    }]);
    carregarMusicasDoRepertorio();
}

window.removerMusicaDoSet = async function(id) {
    await supabase.from('repertorio_musicas').delete().eq('id', id);
    carregarMusicasDoRepertorio();
}

window.alterarOrdemMusica = async function(id, novaOrdem) {
    await supabase.from('repertorio_musicas').update({ ordem: parseInt(novaOrdem) }).eq('id', id);
    carregarMusicasDoRepertorio();
}

// --- ABA 6: CRUD EVENTOS ---
async function listarEventos() {
    const { data } = await supabase.from('eventos').select('*, bandas(nome)').order('data_evento', { ascending: true });
    document.getElementById('lista-eventos').innerHTML = data ? data.map(ev => `
        <tr class="hover:bg-zinc-900/40 transition">
            <td class="py-3 px-4 text-zinc-400">${ev.bandas?.nome || 'Sem Banda'}</td>
            <td class="py-3 px-4 font-semibold text-zinc-200">${ev.nome}</td>
            <td class="py-3 px-4 text-zinc-300">${ev.local}</td>
            <td class="py-3 px-4 text-zinc-400 font-mono">${new Date(ev.data_evento).toLocaleDateString('pt-BR')}</td>
            <td class="py-3 px-4 text-right space-x-2">
                <button onclick="deletarEvento(${ev.id})" class="text-zinc-500 hover:text-brand">🗑️</button>
            </td>
        </tr>
    `).join('') : '';
}

document.getElementById('form-evento').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        banda_id: document.getElementById('evento-banda-id').value,
        repertorio_id: document.getElementById('evento-repertorio-id').value,
        nome: document.getElementById('evento-nome').value,
        local: document.getElementById('evento-local').value,
        data_evento: document.getElementById('evento-data').value,
        observacoes: document.getElementById('evento-observacoes').value
    };

    await supabase.from('eventos').insert([payload]);
    limparFormEvento(); listarEventos();
});

window.deletarEvento = function(id) {
    if(confirm('Excluir este evento da agenda?')) {
        supabase.from('eventos').delete().eq('id', id).then(() => listarEventos());
    }
};

window.limparFormEvento = function() {
    document.getElementById('form-evento').reset();
    document.getElementById('evento-id').value = '';
};

// Executa na inicialização do sistema
init();
