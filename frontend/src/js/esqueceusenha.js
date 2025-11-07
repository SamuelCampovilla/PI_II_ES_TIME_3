// codigo para recuperação de senha - Vinicius Castro

document.addEventListener('DOMContentLoaded', () => {
    // o id no HTML é 'formularioRecuperacao'
    const form = document.getElementById('formularioRecuperacao');

    form.addEventListener('submit', async(event) => {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const infoRecuperacao = { email };

        try {
            const resposta = await fetch('/forgotpassword', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(infoRecuperacao),
            });
                  const result = await resposta.json();
        if (resposta.ok) {
            alert('Email de recuperação enviado com sucesso!');
        } else {
            alert(`Erro ao enviar email de recuperação: ${result.message || 'Email não encontrado.'}`);
        }
      }   
  
        catch (error) {
            console.error('Erro ao processar recuperação de senha', error);
            alert('Erro de conexão com o servidor. Verifique o backend.');
        }});
});