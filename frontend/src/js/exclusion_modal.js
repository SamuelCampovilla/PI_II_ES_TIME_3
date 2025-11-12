/* Samuel Campovilla */

function exclusion_modal() {
  const modal   = document.getElementById('exclusion_modal');
  const cancel  = document.getElementById('cancel-btn');
  const confirm = document.getElementById('confirm-btn');

  
  window.exclusion_modal = function () {
    modal.classList.add('active');
  };

  // fecha
  cancel.addEventListener('click', () => modal.classList.remove('active'));
  confirm.addEventListener('click', () => modal.classList.remove('active'));

  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });


  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') modal.classList.remove('active');
  });
}