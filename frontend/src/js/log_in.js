// código para log-in - Caio Polo

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');

  form.addEventListener('submit', async(event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const infoLogin = { email, password };

    try {
      const resposta = await fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(infoLogin),
      });

      const result = await resposta.json();
      if (resposta.ok) {
        window.location.href = `/frontend/pages/instituicao.html?email=${encodeURIComponent(email)} `;
      } else {
        alert(`Erro ao entrar: ${result.message || 'Credenciais inválidas.'}`);
      }
    } catch (error) {
      console.error('Erro ao fazer log-in', error);
      alert('Erro de conexão com o servidor. Verifique o backend.');
    }
  });

});

