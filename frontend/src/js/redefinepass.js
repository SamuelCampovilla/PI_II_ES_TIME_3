// redefinir senha - Vinicius Castro
console.log('redefinepass.js carregado');
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formularioRedefinir');
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    const emailDisplay = document.getElementById('emailDisplay');
    const emailHidden = document.getElementById('emailHidden');

    if (!form) {
        console.error('Formulário de redefinição não encontrado (id=formularioRedefinir)');
        return;
    }

    if (!email) {
        alert('Email não encontrado na URL. Retornando à página de recuperação.');
        window.location.href = '/frontend/pages/forgotpassword.html';
        return;
    }

  
    if (emailDisplay) {
        emailDisplay.textContent = `Email: ${email}`;
        emailDisplay.style.display = 'block';
    }
    if (emailHidden) {
        emailHidden.value = email;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const novaSenhaEl = document.getElementById('novaSenha');
        const confirmarSenhaEl = document.getElementById('confirmPassword');
        const novaSenha = novaSenhaEl ? novaSenhaEl.value : null;
        const confirmarSenha = confirmarSenhaEl ? confirmarSenhaEl.value : null;

        if (!novaSenha || !confirmarSenha) {
            alert('Preencha ambos os campos de senha.');
            return;
        }
        if (novaSenha !== confirmarSenha) {
            alert('As senhas não coincidem.');
            return;
        }

        try {
            const response = await fetch(`/redefinepassword?email=${encodeURIComponent(email)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ novaSenha })
            });

            const data = await response.json();
            alert(data.message);
            if (response.ok) {
                window.location.href = '/';
            }
        } catch (err) {
            console.error('Erro ao atualizar a senha:', err);
            alert('Erro de conexão com o servidor. Verifique o backend.');
        }
    });
});
