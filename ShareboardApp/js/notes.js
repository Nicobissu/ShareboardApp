document.addEventListener('DOMContentLoaded', () => {
    // Dirección base del backend en desarrollo local
    const BASE_URL = 'http://localhost:3000';
    const API_URL = `${BASE_URL}/notas`;
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
                    enlace.href = `${BASE_URL}/${nota.pdf}`;
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
