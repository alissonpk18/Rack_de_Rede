/* ============================================
   APP.JS - Bootstrap & Event Listeners Globais
   ============================================ */

window.onload = () => {
  inicializarRack();
  inicializarPatchingInterativo();
  instanciarEquipamento('patchpanel');
  setTimeout(() => { instanciarEquipamento('switch'); }, 50);
};

let debounceTimer;
window.addEventListener('resize', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(processarCabeamento, 150);
});
