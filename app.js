document.getElementById('form-banda')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('banda-id').value;

    const payload = {
        nome: document.getElementById('banda-nome').value,
        cidade: document.getElementById('banda-cidade').value,
        estado: document.getElementById('banda-estado').value,
        observacoes: document.getElementById('banda-observacoes').value
    };

    let result;

    if (id) {
        result = await supabase.from('bandas').update(payload).eq('id', id);
    } else {
        result = await supabase.from('bandas').insert([payload]);
    }

    if (result.error) {
        alert("Erro ao salvar banda: " + result.error.message);
        console.error(result.error);
        return;
    }

    alert("Banda salva com sucesso!");
    window.limparFormBanda();
    listarBandas();
    carregarDashboard();
});
