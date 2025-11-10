// redefinir senha - Vinicius Castro
document.getElementById('redefinePassForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    const novaSenha = document.getElementById('newPassword').value;
    
    const response = await fetch(`/redefinepassword`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ novaSenha })
    });;

    const data = await response.json();
    alert(data.message);
    if (response.ok) {
        window.location.href = '/frontend/pages/login.html';
    }
});
