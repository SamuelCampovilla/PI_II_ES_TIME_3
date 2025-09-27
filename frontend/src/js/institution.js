
document.addEventListener('DOMContentLoaded', () => {

    const botaoAbrirPopup = document.querySelector('.add_instituition');
    const botaoFecharPopup = document.getElementById('close-pop-up');
    const popup = document.getElementById('pop-up');

    botaoAbrirPopup.addEventListener('click', () => {
        popup.classList.add('mostrar');
    });

    botaoFecharPopup.addEventListener('click', () => {
        popup.classList.remove('mostrar');
    });
    popup.addEventListener('click', (event) => {
        if (event.target === popup) {
            popup.classList.remove('mostrar');
        }
    });

});