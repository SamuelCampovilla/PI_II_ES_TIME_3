// js para esqueci senha -- Caio Polo

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('forgot-form');


    form.addEventListener('submit', async(event) => {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const infoForgot = {email};

        try{
            const resposta = await fetch('/forgot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(infoForgot),
            });

            const result = await resposta.json();
            if (resposta.ok) {
                alert(result.message);
                window.location.href = '/'; 
            } else {
                alert(result.message || 'Erro ao processar a solicitação');
            }
        }catch(error){
            console.error('Erro ao enviar e-mail:', error);
            alert('Erro de conexão com o servidor. Verifique o backend.');
        }

    });

});