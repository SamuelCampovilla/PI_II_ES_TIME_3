const API_URL = window.location.origin;

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const idDocente = params.get('id');
    console.log("ID Docente:", idDocente);
    
    if (!idDocente) {
        console.error('ID Docente não fornecido');
        return;
    }

    const welcomeEl = document.getElementById('welcome');
    const profNameEl = document.getElementById('prof_name');

    // Fetch docente name
    try {
        const docenteResponse = await fetch(`${API_URL}/api/docente/${idDocente}`, {
            credentials: 'include'
        });
        
        if (docenteResponse.ok) {
            const docente = await docenteResponse.json();
            if (welcomeEl) {
                welcomeEl.textContent = `Bem-vindo, ${docente.nome}!`;
            }
            if (profNameEl) {
                profNameEl.textContent = `Prof. ${docente.nome}`;
            }
        } else {
            console.error('Erro ao buscar nome do docente');
        }
    } catch (error) {
        console.error('Erro ao buscar nome do docente:', error);
    }

    // Fetch institutions
    let institutions = [];
    try {
        const instResponse = await fetch(`${API_URL}/api/docente/${idDocente}/instituicoes`, {
            credentials: 'include'
        });
        
        if (instResponse.ok) {
            institutions = await instResponse.json();
        } else {
            console.error('Erro ao buscar instituições');
        }
    } catch (error) {
        console.error('Erro ao buscar instituições:', error);
    }

    // Render institutions
    const institutionList = document.querySelector('.card_container');
    if (institutionList) {
        institutionList.innerHTML = '';

        for (const institution of institutions) {
            // Fetch courses count for each institution
            let cursosCount = 0;
            try {
                const cursosResponse = await fetch(`${API_URL}/api/instituicoes/${institution.id_instituicao}/cursos`, {
                    credentials: 'include'
                });
                
                if (cursosResponse.ok) {
                    const cursosData = await cursosResponse.json();
                    cursosCount = cursosData.count || 0;
                }
            } catch (error) {
                console.error('Erro ao buscar cursos:', error);
            }

            // Create card
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div class="institution_info">
                    <img src="/frontend/src/assets/images/icon_institution.png" alt="institution icon">
                    <h2 class="institution_name">${institution.nome_instituicao}</h2>
                    <button class="btnExcluir" data-id="${institution.id_instituicao}" type="button">
                        <img src="/frontend/src/assets/images/trash.png" alt="Excluir">
                    </button>
                </div>
                <div class="info">
                    <div>
                        <img src="/frontend/src/assets/images/book.png" alt="book image">
                        <p class="courses">Cursos</p>
                    </div>
                    <p>${cursosCount}</p>
                </div>
                <button class="btnGerenciar" data-id="${institution.id_instituicao}">Gerenciar</button>
            `;

            institutionList.appendChild(card);

            // Delete button
            const btnExcluir = card.querySelector('.btnExcluir');
            btnExcluir.addEventListener('click', async () => {
                const idInstituicao = btnExcluir.getAttribute('data-id');
                
                if (!confirm('Tem certeza que deseja remover esta instituição?')) {
                    return;
                }

                try {
                    const response = await fetch(`${API_URL}/api/docente/${idDocente}/instituicoes/${idInstituicao}`, {
                        method: 'DELETE',
                        credentials: 'include'
                    });

                    if (response.ok) {
                        card.remove();
                    } else {
                        const data = await response.json();
                        alert('Erro ao excluir instituição: ' + (data.error || 'Erro desconhecido'));
                    }
                } catch (error) {
                    console.error('Erro ao excluir instituição:', error);
                    alert('Erro ao excluir instituição');
                }
            });

            // Manage button
            const btnGerenciar = card.querySelector('.btnGerenciar');
            btnGerenciar.addEventListener('click', () => {
                const id = btnGerenciar.getAttribute('data-id');
                window.location.href = `/frontend/pages/menagementPage.html?id=${id}`;
            });
        }
    }

    // Add institution button
    const btnAdd = document.getElementById('btnAdicionar');
    if (btnAdd) {
        btnAdd.addEventListener('click', async (event) => {
            event.preventDefault();
            const nomeInstituicao = document.getElementById('institution-name').value;
            if (!nomeInstituicao.trim()) {
                alert('Por favor, insira o nome da instituição.');
                return;
            }

            try {
                const response = await fetch(`${API_URL}/api/docente/${idDocente}/instituicoes`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ nome_instituicao: nomeInstituicao })
                });

                if (response.ok) {
                    alert('Instituição adicionada com sucesso!');
                    location.reload();
                } else {
                    const data = await response.json();
                    alert('Erro ao adicionar instituição: ' + (data.error || 'Erro desconhecido'));
                }
            } catch (error) {
                console.error('Erro ao adicionar instituição:', error);
                alert('Erro ao adicionar instituição');
            }
        });
    }

    // Logout button
    const btnSair = document.getElementById('btnSair');
    if (btnSair) {
        btnSair.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            try {
                const response = await fetch(`${API_URL}/auth/signout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include'
                });

                // Always redirect, even if there's an error
                window.location.href = '/frontend/src/index.html';
            } catch (error) {
                console.error('Erro ao fazer logout:', error);
                window.location.href = '/frontend/src/index.html';
            }
        });
    }
});
