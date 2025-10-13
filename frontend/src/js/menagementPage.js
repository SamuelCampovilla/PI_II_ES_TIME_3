//Abrir e fechar pop-up ---- Caio

document.addEventListener('DOMContentLoaded', () => {

    const botaoAbrir = document.getElementById('add-course');
    const botaoFechar = document.getElementById('close-pop-up');
    const fundoBlur = document.getElementById('blurred-bg'); 
    const popupConteudo = document.getElementById('pop-up'); 

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

});