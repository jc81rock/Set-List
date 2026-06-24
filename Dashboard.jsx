import React, { useEffect, useState } from 'https://esm.sh/react';
import { supabase } from './supabaseClient.js';

export default function Dashboard() {
  const [stats, setStats] = useState({ bandas: 0, musicas: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarDados() {
      const { count: cB } = await supabase.from('bandas').select('*', { count: 'exact', head: true });
      const { count: cM } = await supabase.from('musicas').select('*', { count: 'exact', head: true });
      setStats({ bandas: cB || 0, musicas: cM || 0 });
      setLoading(false);
    }
    carregarDados();
  }, []);

  if (loading) return React.createElement('div', { style: { color: 'white', padding: '20px' } }, 'Carregando Sistema...');

  return React.createElement('div', {
    style: { backgroundColor: '#121212', color: '#FFFFFF', minHeight: '100vh', padding: '20px', fontFamily: 'sans-serif' }
  }, 
    React.createElement('h1', { style: { borderBottom: '2px solid #D62828', paddingBottom: '10px' } }, '🎵 Repertório Fácil'),
    React.createElement('div', { style: { display: 'flex', gap: '20px', margin: '20px 0' } }, 
      React.createElement('div', { style: { backgroundColor: '#1E1E1E', padding: '20px', borderRadius: '8px', width: '150px' } }, 
        React.createElement('p', { style: { color: '#A7A7A7', margin: 0 } }, 'Bandas'),
        React.createElement('h2', null, stats.bandas)
      ),
      React.createElement('div', { style: { backgroundColor: '#1E1E1E', padding: '20px', borderRadius: '8px', width: '150px' } }, 
        React.createElement('p', { style: { color: '#A7A7A7', margin: 0 } }, 'Músicas'),
        React.createElement('h2', null, stats.musicas)
      )
    ),
    React.createElement('p', { style: { color: '#A7A7A7' } }, 'Conectado com sucesso ao Supabase e hospedado no Netlify!')
  );
}
