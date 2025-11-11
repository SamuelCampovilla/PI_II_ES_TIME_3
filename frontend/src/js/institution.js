// pop-up e adicionar instituição ---- Caio Polo
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

    const urlParams = new URLSearchParams(window.location.search);
    const docenteEmail = urlParams.get('email')

    console.log(docenteEmail);


    if (!docenteEmail) {
        alert('Email não encontrado na URL. Retornando à página de recuperação.');
        window.location.href = '/';
        return;
    }

    const docenteId = await buscaDocenteId(docenteEmail);
    console.log(docenteId);

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

    addButton.addEventListener('click',async () =>{
        try{
    
            const nomeInstituicaoInput = document.getElementById('nomeInstituicao');
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
        }catch(error){
            console.error('Erro ao inserir instituição', error);
            alert('Erro de conexão com o servidor. Verifique o backend.');
        }
    });

});