// Espera todo o HTML da página carregar antes de rodar o script
document.addEventListener('DOMContentLoaded', () => {

    // 1. Seleciona TODOS os elementos que vamos controlar
    const botaoAbrir = document.querySelector('.add_instituition');
    const botaoFechar = document.getElementById('close-pop-up');
    const fundoBlur = document.getElementById('blurred-bg'); // O seu fundo embaçado
    const popupConteudo = document.getElementById('pop-up'); // A caixa branca com o conteúdo

    // 2. Cria funções para organizar o código
    
    // Função para ABRIR o pop-up
    function abrirPopup() {
        // Adiciona a classe 'mostrar' NOS DOIS elementos para que eles apareçam
        fundoBlur.classList.add('mostrar');
        popupConteudo.classList.add('mostrar');
    }

    // Função para FECHAR o pop-up
    function fecharPopup() {
        // Remove a classe 'mostrar' DOS DOIS elementos para que eles sumam
        fundoBlur.classList.remove('mostrar');
        popupConteudo.classList.remove('mostrar');
    }


    // 3. Adiciona os "escutadores" de evento (os cliques)

    // Ao clicar no botão "Adicionar Instituição", chama a função para ABRIR
    botaoAbrir.addEventListener('click', abrirPopup);

    // Ao clicar no botão 'X', chama a função para FECHAR
    botaoFechar.addEventListener('click', fecharPopup);

    // Ao clicar no fundo embaçado, também chama a função para FECHAR
    fundoBlur.addEventListener('click', (event) => {
        // (Isso garante que o clique foi no fundo e não na caixa branca)
        if (event.target === fundoBlur) {
            fecharPopup();
        }
    });

});