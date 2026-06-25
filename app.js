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
