document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('signup-form');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const telefone = document.getElementById('telephone').value;

        const infoCadastro = { name, email, password, telefone };
        let resposta;

        try {
            resposta = await fetch('/cadastro', {
                method: 'POST',
                headers: {
                    'content-type': 'application/json',
                },
                body: JSON.stringify(infoCadastro),

            });

            const result = await resposta.json();
            if (resposta.ok) {
                alert('Cadastro realizado com sucesso!');
                window.location.href = '/';
            } else {
                alert(`Erro ao cadastrar usuário: ${result.message || 'Erro desconhecido do servidor.'}`);
            }
        } catch (error) {
            console.error('Erro ao cadastrar usuário:', error);
            alert('Erro de conexão com o servidor. Verifique se o backend está rodando.');
        }

    });
});