// Samuel Campovilla
// Aguarda todo o HTML ser carregado antes de rodar o script
document.addEventListener('DOMContentLoaded', () => {

  // Pega o link/botão que abre o modal
  const openBtn = document.getElementById('conditions_popup');

  // Pega o botão que fecha o modal
  const closeBtn = document.getElementById('close_modal');

  // Pega o elemento do modal
  const modal   = document.getElementById('terms_modal');

  if (!openBtn || !closeBtn || !modal) {
    return;
  }
  // Ao clicar no botão, abre o modal
  openBtn.addEventListener('click', (e) => {
    e.preventDefault(); 
    modal.classList.add('active');
  });

  // Ao clicar fecha o modal
  closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  // Se clicar fora também fecha o modal
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  // Pressionar a tecla Esc fecha o modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') modal.classList.remove('active');
  });
});
