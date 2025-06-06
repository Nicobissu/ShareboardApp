document.addEventListener('DOMContentLoaded', () => {
    // Usar una ruta relativa ya que el frontend y el API se sirven juntos
    const API_URL = '/notas';
    const form = document.getElementById('notaForm');
    const lista = document.getElementById('listaNotas');
    const textoInput = document.getElementById('notaTexto');
    const pdfInput = document.getElementById('notaPdf');

    const cargarNotas = async () => {
        try {
            const res = await fetch(API_URL);
            const notas = await res.json();
            lista.innerHTML = '';

            notas.forEach(nota => {
                const item = document.createElement('div');
                item.className = 'nota-item';
                item.innerHTML = `<p>${nota.texto}</p>`;

                if (nota.pdf) {
                    const enlace = document.createElement('a');
                    enlace.href = `${API_URL.replace('/notas', '')}/${nota.pdf}`;
                    enlace.textContent = 'Ver PDF';
                    enlace.target = '_blank';
                    item.appendChild(enlace);
                }
                lista.appendChild(item);
            });
        } catch (err) {
            console.error('Error al obtener notas:', err);
        }
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('texto', textoInput.value);
        if (pdfInput.files[0]) {
            formData.append('pdf', pdfInput.files[0]);
        }

        try {
            await fetch(API_URL, { method: 'POST', body: formData });
            form.reset();
            cargarNotas();
        } catch (err) {
            console.error('Error al guardar nota:', err);
        }
    });

    cargarNotas();
});
