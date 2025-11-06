const API_URL = window.location.origin;

async function handleLogIn(email, password) {
  try {
    const response = await fetch(`${API_URL}/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, senha: password })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(`Erro: ${data.error}`);
      return;
    }

    window.location.href = `/frontend/pages/instituicao.html?id=${data.id_docente}`;
  } catch (error) {
    alert('Erro ao fazer login: ' + error.message);
  }
}

const logInForm = document.getElementById('login-form');

if (logInForm) {
  logInForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    await handleLogIn(email, password);
  });
}