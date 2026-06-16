/* ============================================
   RACK-ENGINE.JS - Motor de Inicialização e Drag & Drop
   Enterprise Network Rack Suite 3D - Routing Engine V4.1
   
   Responsabilidades:
   - Gerar slots U no rack
   - Drag & drop de equipamentos entre slots
   - Instanciação de novos equipamentos
   - Renderização do hardware no DOM
   ============================================ */

/**
 * Inicializa a estrutura de slots U do rack.
 * Remove o conteúdo anterior (exceto SVG) e recria os slots.
 */
function inicializarRack() {
  const rack = document.getElementById('rackFrame');
  Array.from(rack.children).forEach(child => {
    if (child.id !== 'svgCables') rack.removeChild(child);
  });

  for (let i = totalSlotsU; i >= 1; i--) {
    const slot = document.createElement('div');
    slot.className = 'rack-u-slot';
    slot.dataset.u = i;
    slot.innerHTML = `<span class="u-marker">${i}U</span>`;

    slot.addEventListener('dragover', (e) => {
      e.preventDefault();
      slot.classList.add('drag-over');
    });
    slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
    slot.addEventListener('drop', manipularDrop);

    rack.appendChild(slot);
  }
  atualizarDropdownsUI();
}

/**
 * Manipula o evento de drop ao arrastar equipamento para outro slot.
 * Realiza swap se o slot alvo já estiver ocupado.
 * @param {DragEvent} e - Evento de drop.
 */
function manipularDrop(e) {
  e.preventDefault();
  const slotAlvo = e.currentTarget;
  slotAlvo.classList.remove('drag-over');

  const hwIdArrastado = e.dataTransfer.getData('text/plain');
  const uAlvo = parseInt(slotAlvo.dataset.u);

  const eqArrastado = rackState.find(eq => eq.id === hwIdArrastado);
  if (!eqArrastado || eqArrastado.u === uAlvo) return;

  const eqExistente = rackState.find(eq => eq.u === uAlvo);

  if (eqExistente) eqExistente.u = eqArrastado.u;
  eqArrastado.u = uAlvo;

  rackState.sort((a, b) => b.u - a.u);
  renderizarHardware();
}

/**
 * Gera o HTML dos blocos de portas RJ45 para um equipamento.
 * @param {number} quantidade - Total de portas do equipamento.
 * @param {string} tipo - Tipo do equipamento ('patchpanel' ou 'switch').
 * @returns {string} HTML dos grupos de portas.
 */
function gerarBlocosPortas(quantidade, tipo) {
  let html = '';
  const numGrupos = 4;
  const portasPorGrupo = 6;
  const linhas = tipo === 'switch' ? 2 : 1;

  if (tipo === 'switch') {
    html += '<div class="switch-layout-container">';
    html += '<div class="matrix-sw-wrapper">';
  } else {
    html += '<div class="ports-container" style="margin-left: 60px;">';
  }

  for (let r = 0; r < linhas; r++) {
    if (tipo === 'switch') html += '<div class="ports-container">';
    for (let g = 0; g < numGrupos; g++) {
      html += '<div class="port-group">';
      for (let p = 1; p <= portasPorGrupo; p++) {
        const pLocal = (r * 24) + (g * portasPorGrupo) + p;
        html += `<div class="port-rj45" data-port-local="${pLocal}" title="Porta Local: ${pLocal}"></div>`;
      }
      html += '</div>';
    }
    if (tipo === 'switch') html += '</div>';
  }

  if (tipo === 'switch') {
    html += '</div>'; // close matrix-sw-wrapper

    // Portas SFP+ (uplink/stacking) para switches
    html += '<div class="sfp-section">';
    html += '<div class="port-group sfp-group">';
    for (let s = 1; s <= 4; s++) {
      const pLocal = 48 + s;
      html += `<div class="port-rj45 port-sfp" data-port-local="${pLocal}" title="SFP+ ${s} (Porta ${pLocal})"></div>`;
    }
    html += '</div>';
    html += '</div>';
    html += '</div>'; // close switch-layout-container
  } else {
    html += '</div>';
  }

  return html;
}

/**
 * Instancia um novo equipamento (Patch Panel ou Switch) no rack.
 * Procura o primeiro slot U disponível e registra no estado global.
 * @param {string} tipo - 'patchpanel' ou 'switch'.
 */
function instanciarEquipamento(tipo) {
  let uTarget = -1;
  for (let i = 1; i <= totalSlotsU; i++) {
    if (!rackState.some(eq => eq.u === i)) {
      uTarget = i;
      break;
    }
  }

  if (uTarget === -1) {
    writeLog("ERRO: Slots esgotados.");
    return;
  }

  const count = rackState.filter(e => e.tipo === tipo).length + 1;
  const eqObj = {
    id: `hw-${tipo}-${Date.now()}`,
    tipo: tipo,
    u: uTarget,
    label: tipo === 'patchpanel' ? `PP-${count}` : `SW-${count}`,
    portas: tipo === 'patchpanel' ? 24 : 52,
    offset: tipo === 'patchpanel' ? globalPPCapacity : globalSWCapacity
  };

  if (tipo === 'patchpanel') globalPPCapacity += 24;
  if (tipo === 'switch') globalSWCapacity += 52;

  rackState.push(eqObj);
  rackState.sort((a, b) => b.u - a.u);

  renderizarHardware();
  atualizarDropdownsUI();
}

/**
 * Renderiza todos os equipamentos do rackState no DOM.
 * Recria os slots, monta o HTML de cada hardware e restaura estados visuais.
 */
function renderizarHardware() {
  inicializarRack();
  rackState.forEach(eq => {
    const slot = document.querySelector(`.rack-u-slot[data-u="${eq.u}"]`);
    if (!slot) return;

    const hw = document.createElement('div');
    hw.className = `hardware-unit ${eq.tipo === 'switch' ? 'hardware-sw' : ''}`;
    hw.id = eq.id;

    hw.draggable = true;
    hw.addEventListener('dragstart', (e) => {
      if (e.target.classList.contains('port-rj45')) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.setData('text/plain', eq.id);
      e.dataTransfer.effectAllowed = 'move';
    });

    const baseLayout = `
      <div class="screw screw-tl"></div><div class="screw screw-bl"></div>
      <div class="screw screw-tr"></div><div class="screw screw-br"></div>
      <div class="hw-branding">${eq.tipo === 'switch' ? '<span class="brand-extreme">EXTREME</span> ' : ''}${eq.label}${eq.tipo === 'switch' ? ' <span class="brand-model">4220-48P-4X</span>' : ''}</div>
    `;

    let innerHTML = baseLayout;

    // Etiquetas numéricas baseadas em Endereçamento Absoluto (offset)
    if (eq.tipo === 'patchpanel') {
      innerHTML += `<div class="label-strip-container" style="margin-left: 60px;">
        <div class="label-strip">${eq.offset + 1} - ${eq.offset + 6}</div>
        <div class="label-strip">${eq.offset + 7} - ${eq.offset + 12}</div>
        <div class="label-strip">${eq.offset + 13} - ${eq.offset + 18}</div>
        <div class="label-strip">${eq.offset + 19} - ${eq.offset + 24}</div>
      </div>`;
    }

    innerHTML += gerarBlocosPortas(eq.portas, eq.tipo);
    hw.innerHTML = innerHTML;
    slot.appendChild(hw);
  });

  // Restaurar indicadores visuais de portas ocupadas
  conexoesAtivas.forEach(c => {
    const pSrc = document.querySelector(`#${c.srcId} .port-rj45[data-port-local="${c.srcPort}"]`);
    const pDst = document.querySelector(`#${c.dstId} .port-rj45[data-port-local="${c.dstPort}"]`);
    if (pSrc) {
      pSrc.classList.add('port-occupied');
      if (c.srcId.startsWith('SW') && c.srcPort % 2 === 0) {
        pSrc.classList.add('port-poe');
      }
    }
    if (pDst) {
      pDst.classList.add('port-occupied');
      if (c.dstId.startsWith('SW') && c.dstPort % 2 === 0) {
        pDst.classList.add('port-poe');
      }
    }
  });

  // Restaurar estado pendente de patching interativo
  if (estadoPatching.srcHw) {
    const pPend = document.querySelector(`#${estadoPatching.srcHw} .port-rj45[data-port-local="${estadoPatching.srcPort}"]`);
    if (pPend) pPend.classList.add('port-pending');
  }

  processarCabeamento();
}

/**
 * Limpa todo o rack: estado, conexões, contadores e DOM.
 */
function limparRack() {
  rackState = [];
  conexoesAtivas = [];
  conexaoCounter = 1;
  globalPPCapacity = 0;
  globalSWCapacity = 0;
  estadoPatching = { srcHw: null, srcPort: null };
  inicializarRack();

  document.getElementById('svgCables').innerHTML = `
    <defs>
      <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>`;

  writeLog("Engine resetado. Variáveis globais limpas.");
}
