import { supabase } from './supabaseClient.js';

// ==========================================================================
// 1. GERENCIADOR DE ABAS E NAVEGAÇÃO GLOBAL
// ==========================================================================
window.switchTab = function(tabId) {
    // Esconde todas as seções principais do layout
    document.querySelectorAll('main > section').forEach(sec => sec.classList.add('hidden'));
    
    // Torna visível a seção da aba selecionada
    const targetSection = document.getElementById(`tab-${tabId}`);
    if (targetSection) targetSection.classList.remove('hidden');

    // Atualiza o estado visual (ativo/inativo) dos botões da sidebar
    document.querySelectorAll('#main-nav button').forEach(btn => {
        if (btn.getAttribute('data-tab') === tabId) {
            btn.className = "w-full text-left px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 bg-brand text-white shadow-sm";
        } else {
            btn.className = "w-full text-left px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100";
        }
    });
    
    // Gatilhos de carregamento dinâmico de dados baseado na aba ativa
    if (tabId === 'dashboard') carregarDashboard();
    if (tabId === 'bandas') listarBandas();
    if (tabId === 'integrantes') { carregarSelectsBandas(); listarIntegrantes(); }
    if (tabId === 'musicas') window.listarMusicas();
    if (tabId === 'repertorios') { carregarSelectsBandas(); listarRepertorios(); }
    if (tabId === 'eventos') { carregarSelectsBandas(); carregarSelectsRepertorios(); listarEventos(); }
};

// Funções globais de limpeza de formulário anexadas ao objeto window
window.limparFormBanda = function() { document.getElementById('form-banda')?.reset(); if(document.getElementById('banda-id')) document.getElementById('banda-id').value = ''; };
window.limparFormIntegrante = function() { document.getElementById('form-integrante')?.reset(); if(document.getElementById('integrante-id')) document.getElementById('integrante-id').value = ''; };
window.limparFormMusica = function() { document.getElementById('form-musica')?.reset(); if(document.getElementById('musica-id')) document.getElementById('musica-id').value = ''; };
window.limparFormEvento = function() { document.getElementById('form-evento')?.reset(); if(document.getElementById('evento-id')) document.getElementById('evento-id').value = ''; };


// ==========================================================================
// 2. LOGICA DA ABA: DASHBOARD
// ==========================================================================
async function carregarDashboard() {
    try {
        const [bandas, integrantes, musicas, repertorios] = await Promise.all([
            supabase.from('bandas').select('*', { count: 'exact', head: true }),
            supabase.from('integrantes').select('*', { count: 'exact', head: true }),
            supabase.from('musicas').select('*', { count: 'exact', head: true }),
            supabase.from('repertorios').select('*', { count: 'exact', head: true })
        ]);

        document.getElementById('dash-bandas').innerText = bandas.count || 0;
        document.getElementById('dash-integrantes').innerText = integrantes.count || 0;
        document.getElementById('dash-musicas').innerText = musicas.count || 0;
        document.getElementById('dash-repertorios').innerText = repertorios.count || 0;

        // Lista próximos eventos agendados
        const { data: eventos } = await supabase.from('eventos').select('nome, local, data').order('data', { ascending: true }).limit(5);
        const tbody = document.getElementById('dash-lista-eventos');
        if (eventos && eventos.length > 0) {
            tbody.innerHTML = eventos.map(ev => `
                <tr class="border-b border-zinc-900 text-zinc-300">
                    <td class="py-3 px-4 font-medium">${ev.nome}</td>
                    <td class="py-3 px-4">${ev.local}</td>
                    <td class="py-3 px-4 text-zinc-500">${new Date(ev.data).toLocaleDateString('pt-BR')}</td>
                </tr>
            `).join('');
        } else {
            tbody.innerHTML = `<tr><td colspan="3" class="py-4 px-4 text-zinc-600 italic">Nenhum evento agendado no calendário.</td></tr>`;
        }
    } catch (err) {
        console.error('Erro ao processar métricas do dashboard:', err);
    }
}


// ==========================================================================
// 3. LOGICA DA ABA: BANDAS
// ==========================================================================
async function listarBandas() {
    const { data: bandas } = await supabase.from('bandas').select('*').order('nome');
    const tbody = document.getElementById('lista-bandas');
    if (!tbody) return;

    tbody.innerHTML = bandas?.map(b => `
        <tr class="border-b border-zinc-900 text-zinc-300 hover:bg-zinc-900/30 transition">
            <td class="py-3 px-4 font-medium">${b.nome}</td>
            <td class="py-3 px-4 text-zinc-400">${b.cidade || ''} ${b.estado ? `- ${b.estado}` : ''}</td>
            <td class="py-3 px-4 text-right space-x-2">
                <button onclick="window.editarBanda('${b.id}', '${b.nome}', '${b.cidade || ''}', '${b.estado || ''}', '${b.observacoes || ''}')" class="text-zinc-400 hover:text-zinc-100 font-medium text-xs">Editar</button>
                <button onclick="window.excluirBanda('${b.id}')" class="text-red-500 hover:text-red-400 font-medium text-xs">Excluir</button>
            </td>
        </tr>
    `).join('') || '';
}

window.editarBanda = function(id, nome, cidade, estado, obs) {
    document.getElementById('banda-id').value = id;
    document.getElementById('banda-nome').value = nome;
    document.getElementById('banda-cidade').value = cidade;
    document.getElementById('banda-estado').value = estado;
    document.getElementById('banda-observacoes').value = obs;
};

window.excluirBanda = function(id) {
    if (confirm('Tem certeza que deseja remover esta banda?')) {
        supabase.from('bandas').delete().eq('id', id).then(() => listarBandas());
    }
};

document.getElementById('form-banda')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('banda-id').value;
    const payload = {
        nome: document.getElementById('banda-nome').value,
        cidade: document.getElementById('banda-cidade').value,
        estado: document.getElementById('banda-estado').value,
        observacoes: document.getElementById('banda-observacoes').value
    };

    if (id) {
        await supabase.from('bandas').update(payload).eq('id', id);
    } else {
        await supabase.from('bandas').insert([payload]);
    }
    window.limparFormBanda();
    listarBandas();
});


// ==========================================================================
// 4. LOGICA DA ABA: INTEGRANTES
// ==========================================================================
async function carregarSelectsBandas() {
    const { data: bandas } = await supabase.from('bandas').select('id, nome').order('nome');
    const html = bandas?.map(b => `<option value="${b.id}">${b.nome}</option>`).join('') || '';
    
    const selIntegrante = document.getElementById('integrante-banda-id');
    const selRepertorio = document.getElementById('repertorio-banda-id');
    const selEvento = document.getElementById('evento-banda-id');
    
    if (selIntegrante) selIntegrante.innerHTML = html;
    if (selRepertorio) selRepertorio.innerHTML = html;
    if (selEvento) selEvento.innerHTML = html;
}

async function listarIntegrantes() {
    const { data: integrantes } = await supabase.from('integrantes').select('*, bandas(nome)').order('nome');
    const tbody = document.getElementById('lista-integrantes');
    if (!tbody) return;

    tbody.innerHTML = integrantes?.map(i => `
        <tr class="border-b border-zinc-900 text-zinc-300 hover:bg-zinc-900/30 transition">
            <td class="py-3 px-4 text-zinc-400">${i.bandas?.nome || 'Sem Banda'}</td>
            <td class="py-3 px-4 font-medium">${i.nome}</td>
            <td class="py-3 px-4 text-zinc-400">${i.instrumento}</td>
            <td class="py-3 px-4">${i.vocal ? '<span class="text-emerald-500">Sim</span>' : '<span class="text-zinc-600">Não</span>'}</td>
            <td class="py-3 px-4 text-right space-x-2">
                <button onclick="window.editarIntegrante('${i.id}', '${i.banda_id}', '${i.nome}', '${i.instrumento}', ${i.vocal}, '${i.observacoes || ''}')" class="text-zinc-400 hover:text-zinc-100 font-medium text-xs">Editar</button>
                <button onclick="window.excluirIntegrante('${i.id}')" class="text-red-500 hover:text-red-400 font-medium text-xs">Excluir</button>
            </td>
        </tr>
    `).join('') || '';
}

window.editarIntegrante = function(id, bandaId, nome, instrumento, vocal, obs) {
    document.getElementById('integrante-id').value = id;
    document.getElementById('integrante-banda-id').value = bandaId;
    document.getElementById('integrante-nome').value = nome;
    document.getElementById('integrante-instrumento').value = instrumento;
    document.getElementById('integrante-vocal').checked = vocal;
    document.getElementById('integrante-observacoes').value = obs;
};

window.excluirIntegrante = function(id) {
    if (confirm('Remover este integrante da banda?')) {
        supabase.from('integrantes').delete().eq('id', id).then(() => listarIntegrantes());
    }
};

document.getElementById('form-integrante')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('integrante-id').value;
    const payload = {
        banda_id: document.getElementById('integrante-banda-id').value,
        nome: document.getElementById('integrante-nome').value,
        instrumento: document.getElementById('integrante-instrumento').value,
        vocal: document.getElementById('integrante-vocal').checked,
        observacoes: document.getElementById('integrante-observacoes').value
    };

    if (id) {
        await supabase.from('integrantes').update(payload).eq('id', id);
    } else {
        await supabase.from('integrantes').insert([payload]);
    }
    window.limparFormIntegrante();
    listarIntegrantes();
});


// ==========================================================================
// 5. LOGICA DA ABA: MÚSICAS (BUSCA, FILTRO E ORDENAÇÃO EXPOSTOS)
// ==========================================================================
window.listarMusicas = async function() {
    let queryBuilder = supabase.from('musicas').select('*');
    
    const busca = document.getElementById('busca-musica')?.value;
    const categoria = document.getElementById('filtro-categoria')?.value;
    const ordenacao = document.getElementById('ordenacao-musica')?.value || 'titulo';

    if (busca) {
        queryBuilder = queryBuilder.or(`titulo.ilike.%${busca}%,artista.ilike.%${busca}%`);
    }
    if (categoria) {
        queryBuilder = queryBuilder.eq('categoria', categoria);
    }
    
    queryBuilder = queryBuilder.order(ordenacao, { ascending: true });
    const { data: musicas } = await queryBuilder;
    const tbody = document.getElementById('lista-musicas');
    if (!tbody) return;

    tbody.innerHTML = musicas?.map(m => `
        <tr class="border-b border-zinc-900 text-zinc-300 hover:bg-zinc-900/30 transition">
            <td class="py-3 px-4 font-medium">${m.titulo}</td>
            <td class="py-3 px-4 text-zinc-400">${m.artista}</td>
            <td class="py-3 px-4 text-zinc-500 text-xs">${m.categoria || ''}</td>
            <td class="py-3 px-4 font-mono text-brand">${m.tom || ''}</td>
            <td class="py-3 px-4 text-zinc-400 font-mono text-xs">${m.bpm || ''}</td>
            <td class="py-3 px-4 text-zinc-500 font-mono text-xs">${m.duracao || ''}</td>
            <td class="py-3 px-4 text-right space-x-2">
                <button onclick="window.editarMusica('${m.id}', '${m.titulo}', '${m.artista}', '${m.categoria || ''}', '${m.tom || ''}', '${m.bpm || ''}', '${m.duracao || ''}', '${m.observacoes || ''}')" class="text-zinc-400 hover:text-zinc-100 font-medium text-xs">Editar</button>
                <button onclick="window.excluirMusica('${m.id}')" class="text-red-500 hover:text-red-400 font-medium text-xs">Excluir</button>
            </td>
        </tr>
    `).join('') || '';
};

window.editarMusica = function(id, titulo, artista, categoria, tom, bpm, duracao, obs) {
    document.getElementById('musica-id').value = id;
    document.getElementById('musica-titulo').value = titulo;
    document.getElementById('musica-artista').value = artista;
    document.getElementById('musica-categoria').value = categoria;
    document.getElementById('musica-tom').value = tom;
    document.getElementById('musica-bpm').value = bpm;
    document.getElementById('musica-duracao').value = duracao;
    document.getElementById('musica-observacoes').value = obs;
};

window.excluirMusica = function(id) {
    if (confirm('Deseja deletar permanentemente esta música do acervo global?')) {
        supabase.from('musicas').delete().eq('id', id).then(() => window.listarMusicas());
    }
};

document.getElementById('form-musica')?.addEventListener('submit', async (e) => {
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

    if (id) {
        await supabase.from('musicas').update(payload).eq('id', id);
    } else {
        await supabase.from('musicas').insert([payload]);
    }
    window.limparFormMusica();
    window.listarMusicas();
});


// ==========================================================================
// 6. LOGICA DA ABA: REPERTÓRIOS & SET-LISTS
// ==========================================================================
let repertorioAtivoId = null;

async function listarRepertorios() {
    const { data: reps } = await supabase.from('repertorios').select('*, bandas(nome)').order('nome');
    const container = document.getElementById('lista-repertorios');
    if (!container) return;

    container.innerHTML = reps?.map(r => `
        <div class="flex items-center justify-between p-4 bg-zinc-900/40 border border-zinc-900 rounded-lg hover:border-zinc-800 transition">
            <div>
                <h5 class="text-sm font-semibold text-zinc-100">${r.nome}</h5>
                <p class="text-xs text-zinc-500 mt-0.5">${r.bandas?.nome || 'Sem Banda'} ${r.observacoes ? `• ${r.observacoes}` : ''}</p>
            </div>
            <div class="flex items-center gap-3">
                <button onclick="window.gerenciarGradeRepertorio('${r.id}', '${r.nome}')" class="text-xs font-semibold px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-brand rounded transition shadow-sm">Estruturar Músicas</button>
                <button onclick="window.excluirRepertorio('${r.id}')" class="text-zinc-600 hover:text-red-500 transition text-xs">Excluir</button>
            </div>
        </div>
    `).join('') || '<p class="text-xs text-zinc-500 italic">Nenhum repertório estruturado.</p>';
}

window.excluirRepertorio = function(id) {
    if (confirm('Deseja excluir esta setlist?')) {
        supabase.from('repertorios').delete().eq('id', id).then(() => listarRepertorios());
    }
};

document.getElementById('form-repertorio')?.addEventListener('submit', async (e) => {
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

// --- GERENCIADOR EMBUTIDO DA GRADE DA SET-LIST ---
window.gerenciarGradeRepertorio = async function(id, nome) {
    repertorioAtivoId = id;
    document.getElementById('nome-repertorio-ativo').innerText = nome;
    document.getElementById('gerenciador-musicas-repertorio').classList.remove('hidden');

    // Carrega músicas que já pertencem a essa playlist
    const { data: vinculos } = await supabase.from('repertorio_musicas').select('*, musicas(*)').eq('repertorio_id', id).order('ordem');
    
    // Carrega todo o acervo global
    const { data: todasMusicas } = await supabase.from('musicas').select('*').order('titulo');

    // Renderiza Acervo Disponível para Adicionar
    const containerDisponivel = document.getElementById('lista-add-musicas-disponiveis');
    containerDisponivel.innerHTML = todasMusicas?.map(m => `
        <div class="flex justify-between items-center p-2 hover:bg-zinc-900 transition text-xs text-zinc-300">
            <span>${m.titulo} <span class="text-zinc-500">(${m.artista})</span></span>
            <button onclick="window.adicionarMusicaNoRepertorio('${m.id}')" class="text-emerald-500 font-bold hover:underline">+ Adicionar</button>
        </div>
    `).join('') || '';

    // Renderiza a Grade Atual
    renderizarGradeAtual(vinculos);
};

function renderizarGradeAtual(vinculos) {
    const containerGrade = document.getElementById('lista-musicas-do-repertorio');
    
    let totalSegundos = 0;
    let somaBpm = 0;
    let qtdBpmValidos = 0;

    if (!vinculos || vinculos.length === 0) {
        containerGrade.innerHTML = `<p class="text-xs text-zinc-600 italic p-2">Nenhuma música escalada nesta set-list ainda.</p>`;
        atualizarMetricasGrade(0, "00:00", 0);
        return;
    }

    containerGrade.innerHTML = vinculos.map((v, index) => {
        const m = v.musicas;
        if (!m) return '';

        // Cálculo de Duração e BPM médios
        if (m.duracao && m.duracao.includes(':')) {
            const parts = m.duracao.split(':');
            totalSegundos += (parseInt(parts[0]) * 60) + parseInt(parts[1]);
        }
        if (m.bpm) {
            somaBpm += m.bpm;
            qtdBpmValidos++;
        }

        return `
            <div class="flex items-center gap-3 p-3 bg-zinc-950 border border-zinc-900 rounded text-sm text-zinc-300">
                <input type="number" value="${v.ordem || (index + 1)}" onchange="window.mudarOrdemMusica('${v.id}', this.value)" class="w-12 bg-zinc-900 border border-zinc-800 text-center rounded text-xs py-1 text-zinc-100 font-mono focus:outline-none focus:border-zinc-700">
                <div class="flex-1">
                    <span class="font-medium text-zinc-200">${m.titulo}</span>
                    <span class="text-xs text-zinc-500 block">${m.artista} • Tom: <span class="text-brand font-mono">${m.tom || 'N/A'}</span></span>
                </div>
                <button onclick="window.removerMusicaDoRepertorio('${v.id}')" class="text-red-500 text-xs hover:underline">Remover</button>
            </div>
        `;
    }).join('');

    // Formatação de métricas consolidadas
    const minutos = Math.floor(totalSegundos / 60);
    const segundos = totalSegundos % 60;
    const tempoString = `${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
    const bpmMedio = qtdBpmValidos > 0 ? Math.round(somaBpm / qtdBpmValidos) : 0;

    atualizarMetricasGrade(vinculos.length, tempoString, bpmMedio);
}

function atualizarMetricasGrade(qtd, tempo, bpm) {
    document.getElementById('rep-qtd-musicas').innerText = qtd;
    document.getElementById('rep-tempo-total').innerText = tempo;
    document.getElementById('rep-bpm-medio').innerText = bpm;
}

window.adicionarMusicaNoRepertorio = async function(musicaId) {
    // Descobre a última ordem para empilhar no fim da lista
    const { data } = await supabase.from('repertorio_musicas').select('ordem').eq('repertorio_id', repertorioAtivoId).order('ordem', { ascending: false }).limit(1);
    const proximaOrdem = data && data.length > 0 ? (data[0].ordem + 1) : 1;

    await supabase.from('repertorio_musicas').insert([{ repertorio_id: repertorioAtivoId, musica_id: musicaId, ordem: proximaOrdem }]);
    window.gerenciarGradeRepertorio(repertorioAtivoId, document.getElementById('nome-repertorio-ativo').innerText);
};

window.mudarOrdemMusica = async function(vinculoId, novaOrdem) {
    await supabase.from('repertorio_musicas').update({ ordem: parseInt(novaOrdem) }).eq('id', vinculoId);
    window.gerenciarGradeRepertorio(repertorioAtivoId, document.getElementById('nome-repertorio-ativo').innerText);
};

window.removerMusicaDoRepertorio = async function(vinculoId) {
    await supabase.from('repertorio_musicas').delete().eq('id', vinculoId);
    window.gerenciarGradeRepertorio(repertorioAtivoId, document.getElementById('nome-repertorio-ativo').innerText);
};


// ==========================================================================
// 7. LOGICA DA ABA: EVENTOS & CALENDÁRIO
// ==========================================================================
async function carregarSelectsRepertorios() {
    const { data: reps } = await supabase.from('repertorios').select('id, nome').order('nome');
    const select = document.getElementById('evento-repertorio-id');
    if (select) {
        select.innerHTML = reps?.map(r => `<option value="${r.id}">${r.nome}</option>`).join('') || '';
    }
}

async function listarEventos() {
    const { data: eventos } = await supabase.from('eventos').select('*, bandas(nome)').order('data', { ascending: false });
    const tbody = document.getElementById('lista-eventos');
    if (!tbody) return;

    tbody.innerHTML = eventos?.map(e => `
        <tr class="border-b border-zinc-900 text-zinc-300 hover:bg-zinc-900/30 transition">
            <td class="py-3 px-4 text-zinc-400">${e.bandas?.nome || 'Sem Banda'}</td>
            <td class="py-3 px-4 font-medium">${e.nome}</td>
            <td class="py-3 px-4 text-zinc-400">${e.local}</td>
            <td class="py-3 px-4 text-zinc-500 font-mono text-xs">${new Date(e.data).toLocaleDateString('pt-BR')}</td>
            <td class="py-3 px-4 text-right space-x-2">
                <button onclick="window.editarEvento('${e.id}', '${e.banda_id}', '${e.repertorio_id}', '${e.nome}', '${e.local}', '${e.data}', '${e.observacoes || ''}')" class="text-zinc-400 hover:text-zinc-100 font-medium text-xs">Editar</button>
                <button onclick="window.excluirEvento('${e.id}')" class="text-red-500 hover:text-red-400 font-medium text-xs">Excluir</button>
            </td>
        </tr>
    `).join('') || '';
}

window.editarEvento = function(id, bandaId, repId, nome, local, data, obs) {
    document.getElementById('evento-id').value = id;
    document.getElementById('evento-banda-id').value = bandaId;
    document.getElementById('evento-repertorio-id').value = repId;
    document.getElementById('evento-nome').value = nome;
    document.getElementById('evento-local').value = local;
    document.getElementById('evento-data').value = data;
    document.getElementById('evento-observacoes').value = obs;
};

window.excluirEvento = function(id) {
    if (confirm('Pretende remover este evento da agenda?')) {
        supabase.from('eventos').delete().eq('id', id).then(() => listarEventos());
    }
};

document.getElementById('form-evento')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('evento-id').value;
    const payload = {
        banda_id: document.getElementById('evento-banda-id').value,
        repertorio_id: document.getElementById('evento-repertorio-id').value,
        nome: document.getElementById('evento-nome').value,
        local: document.getElementById('evento-local').value,
        data: document.getElementById('evento-data').value,
        observacoes: document.getElementById('evento-observacoes').value
    };

    if (id) {
        await supabase.from('eventos').update(payload).eq('id', id);
    } else {
        await supabase.from('eventos').insert([payload]);
    }
    window.limparFormEvento();
    listarEventos();
});


// ==========================================================================
// 8. INICIALIZAÇÃO DA APLICAÇÃO
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Inicia o app visualizando a aba principal do Dashboard
    if (typeof window.switchTab === 'function') {
        window.switchTab('dashboard');
    }
});
