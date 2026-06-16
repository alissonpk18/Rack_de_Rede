/* ============================================
   SEARCH-ENGINE.JS - Busca Universal Inteligente
   ============================================ */

/**
 * Reseta o estado visual da busca universal, limpando destaques e reexibindo todos os cabos.
 */
function resetBuscaUniversal() {
  const rackFrame = document.getElementById('rackFrame');
  
  // Limpar destaque de portas
  Array.from(rackFrame.querySelectorAll('.port-active')).forEach(el => el.classList.remove('port-active'));
  
  // Limpar estados ativo e oculto dos cabos
  Array.from(document.getElementById('svgCables').querySelectorAll('.cable-path')).forEach(el => {
    el.classList.remove('cable-active');
    el.classList.remove('cable-hidden');
    el.style.filter = '';
  });
}

function executarBuscaUniversal() {
  const queryVal = document.getElementById('queryUniversal').value.trim();
  
  // Se a busca estiver vazia, restaura o estado padrão
  if (queryVal === '') {
    resetBuscaUniversal();
    writeLog("Busca universal limpa. Todos os cabos reexibidos.");
    return;
  }

  const query = parseInt(queryVal);
  const rackFrame = document.getElementById('rackFrame');

  // Reset estado visual antes de aplicar novo destaque
  resetBuscaUniversal();

  if (isNaN(query) || query < 1) {
    writeLog("Exceção: Forneça um ID Global numérico válido.");
    return;
  }

  // 1. Resolver Hardware via Offset
  const eqAlvo = rackState.find(eq =>
    eq.tipo === 'patchpanel' && query > eq.offset && query <= eq.offset + eq.portas
  );

  if (!eqAlvo) {
    writeLog(`Trace Falhou: ID Global Absoluto [${query}] excede a capacidade estrutural ou não pertence a um Patch Panel.`);
    return;
  }

  // 2. Calcular Porta Local
  const portaLocal = query - eqAlvo.offset;

  // 3. Consultar Matriz de Conexões
  const conexao = conexoesAtivas.find(c =>
    (c.srcId === eqAlvo.id && c.srcPort === portaLocal) ||
    (c.dstId === eqAlvo.id && c.dstPort === portaLocal)
  );

  const pLocalEl = rackFrame.querySelector(`#${eqAlvo.id} .port-rj45[data-port-local="${portaLocal}"]`);
  if (pLocalEl) pLocalEl.classList.add('port-active');

  if (conexao) {
    const idDestino = conexao.srcId === eqAlvo.id ? conexao.dstId : conexao.srcId;
    const portaDestino = conexao.srcId === eqAlvo.id ? conexao.dstPort : conexao.srcPort;

    const pDstEl = rackFrame.querySelector(`#${idDestino} .port-rj45[data-port-local="${portaDestino}"]`);
    if (pDstEl) pDstEl.classList.add('port-active');

    const caboAlvo = document.querySelector(`.cable-path[data-link-ref="${conexao.id}"]`);
    if (caboAlvo) {
      caboAlvo.classList.add('cable-active');
      caboAlvo.style.filter = 'url(#neon-glow)';
      caboAlvo.parentNode.appendChild(caboAlvo);

      // Ocultar todos os outros cabos
      Array.from(document.getElementById('svgCables').querySelectorAll('.cable-path')).forEach(el => {
        if (el !== caboAlvo) {
          el.classList.add('cable-hidden');
        }
      });
    }

    const eqSw = rackState.find(eq => eq.id === idDestino);
    const swAbsoluto = eqSw ? eqSw.offset + portaDestino : portaDestino;

    writeLog(`Universal ID ${query}: Conectado! Mapeado em ${eqAlvo.label} (Local ${portaLocal}) ⟷ ${eqSw ? eqSw.label : idDestino} (Absoluto: ${swAbsoluto} / Local: ${portaDestino})`);
    pLocalEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    // Se a porta foi encontrada mas não há cabo conectado, ocultar todos os cabos do rack
    Array.from(document.getElementById('svgCables').querySelectorAll('.cable-path')).forEach(el => {
      el.classList.add('cable-hidden');
    });

    writeLog(`Universal ID ${query}: Encontrado fisicamente no ${eqAlvo.label} (Porta ${portaLocal}), porém offline (Sem cabo conectado).`);
    pLocalEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// Ouvintes de evento em tempo real para o campo de busca
document.getElementById('queryUniversal').addEventListener('input', function(e) {
  if (e.target.value === '') {
    resetBuscaUniversal();
  }
});

document.getElementById('queryUniversal').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') {
    executarBuscaUniversal();
  }
});

