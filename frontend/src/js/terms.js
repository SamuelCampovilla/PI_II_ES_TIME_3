// Samuel Campovilla
// Aguarda todo o HTML ser carregado antes de rodar
document.addEventListener('DOMContentLoaded', () => {
  
  const openBtn = document.getElementById('conditions_popup');
  const closeBtn = document.getElementById('close_modal');
  const modal   = document.getElementById('terms_modal');

  if (!openBtn || !closeBtn || !modal) {
    return;
  }
  // Abre o modal
  openBtn.addEventListener('click', (e) => {
    e.preventDefault(); 
    modal.classList.add('active');
  });

  // fecha o modal
  closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  // Se clicar fora também fecha o modal
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  // Esc fecha o modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') modal.classList.remove('active');
  });
});
