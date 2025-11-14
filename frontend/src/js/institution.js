// pop-up e adicionar instituição ---- Caio Polo

async function contaCursos(institutionId) {
    await fetch(`/cursos?institutionId=${encodeURIComponent(institutionId)}`)
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('Erro ao buscar cursos');
            }
        })
        .then(data => {
            const cursos = data.cursos || [];
            return cursos.length;
        })
        .catch(error => {
            console.error('Erro ao contar cursos:', error);
            return 0;
        });
}

async function buscaDocenteId(email) {
    try {
        const response = await fetch(`/docente/id?email=${email}`);
        if (response.ok) {
            const data = await response.json();
            return data.id;
        }
    } catch (error) {
        console.error("Falha ao buscar ID:", error);
    }
    return null;
}

document.addEventListener('DOMContentLoaded', async() => {

    const botaoAbrir = document.getElementById('add_instituition');
    const botaoFechar = document.getElementById('close-pop-up');
    const fundoBlur = document.getElementById('blurred-bg'); 
    const popupConteudo = document.getElementById('pop-up'); 
    const addButton = document.getElementById('btnAdicionar');
    const voltar = document.getElementById('btnSair');
    const nomeEl = document.getElementById('prof_name');
    const welcomeEl = document.getElementById('welcome')
    

    const nomeInstituicaoInput = document.getElementById('nomeInstituicao');

    const urlParams = new URLSearchParams(window.location.search);
    const docenteEmail = urlParams.get('email');

    console.log(docenteEmail);


    if (!docenteEmail) {
        alert('Email não encontrado na URL. Retornando à página inicial.');
        window.location.href = '/';
        return;
    }

    const docenteId = await buscaDocenteId(docenteEmail);

    function abrirPopup() {
        fundoBlur.classList.add('mostrar');
        popupConteudo.classList.add('mostrar');
    }

    function fecharPopup() {
        fundoBlur.classList.remove('mostrar');
        popupConteudo.classList.remove('mostrar');
    }

    botaoAbrir.addEventListener('click', abrirPopup);
    botaoFechar.addEventListener('click', fecharPopup);
    fundoBlur.addEventListener('click', (event) => {
        if (event.target === fundoBlur) {
            fecharPopup();
        }
    });
    voltar.addEventListener('click', ()=>{
        window.location.href = '/';
    })


    async function adicionarInstituicao(){
        try{
            
            
            if (!nomeInstituicaoInput || !nomeInstituicaoInput.value.trim()) { 
                alert('Por favor, digite o nome da instituição.');
                return;
            }
            
            const nomeInstituicao = nomeInstituicaoInput.value.trim();
            
            const resposta = await fetch(`/instituicao?id=${encodeURIComponent(docenteId)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nomeInstituicao }) ,
                body: JSON.stringify({ nomeInstituicao }) 
            });
            
            const result = await resposta.json();
            if (resposta.ok) {
                alert('Instituição adicionada com sucesso!');
                nomeInstituicaoInput.value = '';
                fecharPopup();
                location.reload();
            } else {
                alert(`Erro ao adicionar instituição: ${result.message || 'Tente novamente.'}`);
            }         
            }         
         catch(error){
            console.error('Erro ao inserir instituição', error);
            alert('Erro de conexão com o servidor. Verifique o backend.');
        }

    }
    addButton.addEventListener('click',async () =>{
        await adicionarInstituicao();
    });

    try{
        const resposta = await fetch(`/instituicaoNomeDocente?docenteId=${encodeURIComponent(docenteId)}`);
        const data = await resposta.json();
        const nome = data.nomeDocente;

        welcomeEl.textContent = `Bem vindo! ${nome}.`;
        nomeEl.textContent = `Prof. ${nome}`;

    }catch(error){
        console.error('erro ao encontrar professor');
        alert('Erro de conexão com o servidor. Verifique o backend.');
    }
    const institutionListContainer = document.querySelector('.card_container');
    
    if (institutionListContainer && docenteId) {
        institutionListContainer.innerHTML = '';
        
        try{
            const resposta = await fetch(`/pegarInstituicoes?docenteId=${encodeURIComponent(docenteId)}`);

            const data = await resposta.json();
            if(resposta.ok && data.instituicoes && data.instituicoes.length === 0){
                abrirPopup();
                return;
            }
            

            if (resposta.ok && data.instituicoes) { 
                
                data.instituicoes.forEach(institution => {
                    
                 
                    const cursosCount = contaCursos(institution.id_instituicao);
                    
                    const card = document.createElement('div');
                    card.className = 'card';
                    card.innerHTML = `
                        <div class="institution_info">
                                <img src="/assets/images/icon_institution.png" alt="institution icon">
                                <h2 class="institution_name">${institution.nome_instituicao}</h2> 
                                <button class="btnExcluir" data-id="${institution.id_instituicao}" type="button">
                                    <img src="/assets/images/trash.png" alt="Excluir"> 
                                </button>
                            </div>
                            <div class="info">
                                <div>
                                    <img src="/assets/images/book.png" alt="book image">
                                    <p class="courses">Cursos</p>
                                </div>
                                <p>${cursosCount}</p>
                            </div>
                            <button class="btnGerenciar" data-id="${institution.id_instituicao}">Gerenciar</button>
                        `;
                    institutionListContainer.appendChild(card);
                });
                document.querySelectorAll('.btnGerenciar').forEach(button => {
                    button.addEventListener('click', function() {
                    const institutionId = this.getAttribute('data-id');
                    window.location.href = `/frontend/pages/menagementPage.html?institutionId=${institutionId}&email=${docenteEmail}`;
                 });
    });

            } else {
                alert(`Erro ao carregar instituições: ${data.message || 'Verifique o servidor.'}`);
            }

        }catch(error){
            console.error('Erro ao buscar instituições', error);
            alert('Erro de conexão com o servidor. Verifique o backend.');
        }
    }

    const exclusionModalModule = await import('./exclusion_modal.js');  
    if (typeof exclusionModalModule.exclusion_modal === 'function') exclusionModalModule.exclusion_modal();

    // helper para fechar modal localmente
    function closeExclusionModal() {
        const modal = document.getElementById('exclusion_modal');
        if (modal) modal.style.display = 'none';
        
        const loadingEl = document.getElementById('exclusion_loading');
        if (loadingEl) loadingEl.style.display = 'none';
        const confirmButton = document.getElementById('confirm-btn');
        if (confirmButton) {
            confirmButton.disabled = false;
            confirmButton.textContent = 'Sim, excluir';
        }
        const bodyTextEl = document.getElementById('exclusion_body_text');
        if (bodyTextEl) bodyTextEl.textContent = 'Esta ação é irrevogável. Todas as turmas e notas associadas poderão ser perdidas.';
    }

    // delegação para botão excluir nos cards
    document.addEventListener('click', async (event) => {
        const excluirBtn = event.target.closest('.btnExcluir');
        if (!excluirBtn) return;

        const institutionId = excluirBtn.getAttribute('data-id');
        const institutionName = excluirBtn.getAttribute('data-name') || 'Instituição';

        // elementos do modal
        const itemNameEl = document.getElementById('exclusion_item_name');
        const bodyTextEl = document.getElementById('exclusion_body_text');
        const confirmButton = document.getElementById('confirm-btn');
        const cancelButton = document.getElementById('cancel-btn');
        const loadingEl = document.getElementById('exclusion_loading');

        // atualiza nome no modal e estado inicial
        if (itemNameEl) itemNameEl.textContent = institutionName;
        if (bodyTextEl) bodyTextEl.textContent = 'Verificando se existem cursos associados...';
        if (confirmButton) {
            confirmButton.disabled = true;
            confirmButton.textContent = 'Verificando...';
        }
        if (loadingEl) loadingEl.style.display = 'none';

        // abrir modal (se função do módulo existir, use-a; caso contrário, exiba o modal direto)
        const modalEl = document.getElementById('exclusion_modal');
        if (typeof window.exclusion_modal === 'function') {
            window.exclusion_modal();
        } else if (modalEl) {
            modalEl.style.display = 'block';
        }

        // verifica se há cursos vinculados (rota /cursos?institutionId=...)
        let canDelete = false;
        try {
            const respCursos = await fetch(`/cursos?institutionId=${encodeURIComponent(institutionId)}`);
            if (respCursos.ok) {
                const cursosData = await respCursos.json();
                const cursos = cursosData.cursos ?? cursosData ?? [];
                const qtd = Array.isArray(cursos) ? cursos.length : Number(cursosData.count ?? 0);

                if (qtd > 0) {
                    canDelete = false;
                    if (bodyTextEl) bodyTextEl.textContent = `Não é possível excluir. Existem ${qtd} curso(s) vinculados a esta instituição. Remova-os primeiro.`;
                    if (confirmButton) {
                        confirmButton.disabled = true;
                        confirmButton.textContent = 'Exclusão impossível';
                    }
                } else {
                    canDelete = true;
                    if (bodyTextEl) bodyTextEl.textContent = 'Esta ação é irrevogável. Todas as turmas e notas associadas poderão ser perdidas.';
                    if (confirmButton) {
                        confirmButton.disabled = false;
                        confirmButton.textContent = 'Sim, excluir';
                    }
                }
            } else {
                canDelete = false;
                if (bodyTextEl) bodyTextEl.textContent = 'Não foi possível verificar cursos. Exclusão bloqueada por segurança.';
                if (confirmButton) {
                    confirmButton.disabled = true;
                    confirmButton.textContent = 'Verificação falhou';
                }
            }
        } catch (err) {
            console.error('Erro ao verificar cursos:', err);
            canDelete = false;
            if (bodyTextEl) bodyTextEl.textContent = 'Erro ao verificar cursos. Exclusão bloqueada por segurança.';
            if (confirmButton) {
                confirmButton.disabled = true;
                confirmButton.textContent = 'Verificação falhou';
            }
        }

        // confirma exclusão
        const confirmHandler = async () => {
            if (!canDelete) {
                alert('Exclusão bloqueada: existem cursos vinculados ou não foi possível verificar.');
                return;
            }

            // mostra loading e bloqueia botões
            if (loadingEl) loadingEl.style.display = 'flex';
            if (confirmButton) {
                confirmButton.disabled = true;
                confirmButton.textContent = 'Excluindo...';
            }
            if (cancelButton) cancelButton.disabled = true;

            try {
                const resposta = await fetch(`/instituicao?institutionId=${encodeURIComponent(institutionId)}`, {
                    method: 'DELETE'
                });
                const result = await resposta.json().catch(()=>({}));

                if (resposta.ok) {
                    alert('Instituição excluída com sucesso!');
                    
                    const card = document.querySelector(`.card[data-id="${institutionId}"]`);
                    if (card) card.remove();
                    closeExclusionModal();
                } else {
                    alert(`Erro ao excluir instituição: ${result.message || 'Tente novamente.'}`);
                    
                    if (loadingEl) loadingEl.style.display = 'none';
                    if (confirmButton) {
                        confirmButton.disabled = false;
                        confirmButton.textContent = 'Sim, excluir';
                    }
                    if (cancelButton) cancelButton.disabled = false;
                }
            } catch (error) {
                console.error('Erro ao excluir instituição:', error);
                alert('Erro ao excluir instituição. Tente novamente mais tarde.');
                if (loadingEl) loadingEl.style.display = 'none';
                if (confirmButton) {
                    confirmButton.disabled = false;
                    confirmButton.textContent = 'Sim, excluir';
                }
                if (cancelButton) cancelButton.disabled = false;
            } finally {
                // remove listener para evitar múltiplos handlers
                if (confirmButton) confirmButton.removeEventListener('click', confirmHandler);
            }
        };

    });
});