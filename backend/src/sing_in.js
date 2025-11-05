const API_URL = window.location.origin;

async function handleSignUp(email, password, name, phone) {
  try {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ 
        nome: name, 
        email: email, 
        telefone: phone, 
        senha: password 
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(`Erro: ${data.error}`);
      return;
    }

    alert('Cadastro realizado com sucesso!');
    window.location.href = `/frontend/pages/instituicao.html?id=${data.id_docente}`;
  } catch (error) {
    alert('Erro ao cadastrar: ' + error.message);
  }
}

const signUpForm = document.getElementById('signup-form');

if (signUpForm) {
  signUpForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm_password').value;
    const name = document.getElementById('name').value;
    const phone = document.getElementById('telephone').value;

    // Password confirmation validation
    if (password !== confirmPassword) {
      alert('As senhas não coincidem. Por favor, verifique e tente novamente.');
      return;
    }

    const btnAceito = document.getElementById('conditions');
    if (!btnAceito.checked) {
      alert('Você deve aceitar os termos e condições para se cadastrar.');
      return;
    }
    
    await handleSignUp(email, password, name, phone);
  });
}
