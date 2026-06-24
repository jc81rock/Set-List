import { supabase } from './supabaseClient.js';

// Função que lê os dados do Supabase e atualiza a tela
async function atualizarEstatisticas() {
  // Pega os elementos do HTML onde vamos escrever os números
  const labelBandas = document.getElementById('qtd-bandas');
  const labelMusicas = document.getElementById('qtd-musicas');

  try {
    // 1. Conta quantas Bandas têm no banco
    const { count: countBandas, error: errorBandas } = await supabase
      .from('bandas')
      .select('*', { count: 'exact', head: true });

    if (errorBandas) throw errorBandas; // Se der erro, para tudo e avisa

    // 2. Conta quantas Músicas têm no banco
    const { count: countMusicas, error: errorMusicas } = await supabase
      .from('musicas')
      .select('*', { count: 'exact', head: true });

    if (errorMusicas) throw errorMusicas; // Se der erro, para tudo e avisa

    // 3. Escreve os números na tela (ou 0 se for nulo)
    labelBandas.innerText = countBandas || 0;
    labelMusicas.innerText = countMusicas || 0;

  } catch (erro) {
    console.error('Erro ao conectar com o banco:', erro);
    // Se der erro, avisa na tela de forma visível
    labelBandas.innerText = '⚠️';
    labelMusicas.innerText = '⚠️';
    labelBandas.style.color = 'red';
    labelMusicas.style.color = 'red';
  }
}

// Roda a função assim que a página carregar
atualizarEstatisticas();
