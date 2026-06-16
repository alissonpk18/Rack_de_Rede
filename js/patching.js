/* ============================================
   PATCHING.JS - Motor Interativo de Cabeamento
   Enterprise Network Rack Suite 3D - Routing Engine V4.1
   
   Responsabilidades:
   - Patching por clique interativo (porta a porta)
   - Patching manual via dropdowns (sidebar)
   - Gerenciamento dos dropdowns de UI
   ============================================ */

/**
 * Handler de clique no rack para patching interativo.
 * Primeiro clique seleciona a porta de origem (pendente),
 * segundo clique efetua a conexão.
 */
function inicializarPatchingInterativo() {
  document.getElementById('rackFrame').addEventListener('click', function (e) {
    const portEl = e.target.closest('.port-rj45');
    if (!portEl) return;

    const hwEl = portEl.closest('.hardware-unit');
    const hwId = hwEl.id;
    const portNum = parseInt(portEl.dataset.portLocal);
    const eqTarget = rackState.find(eq => eq.id === hwId);

    // Verificar se a porta já está ocupada
    const ocupada = conexoesAtivas.some(c =>
      (c.srcId === hwId && c.srcPort === portNum) ||
      (c.dstId === hwId && c.dstPort === portNum)
    );

    if (ocupada) {
      writeLog(`Negado: Porta já possui link.`);
      return;
    }

    // Primeiro clique: selecionar origem
    if (!estadoPatching.srcHw) {
      estadoPatching.srcHw = hwId;
      estadoPatching.srcPort = portNum;
      portEl.classList.add('port-pending');
    } else {
      // Segundo clique na mesma porta: cancelar
      if (estadoPatching.srcHw === hwId && estadoPatching.srcPort === portNum) {
        portEl.classList.remove('port-pending');
        estadoPatching = { srcHw: null, srcPort: null };
        return;
      }

      // Segundo clique em outra porta: efetuar patching
      const corCabo = document.getElementById('selCorCabo').value;
      const eqOrigem = rackState.find(eq => eq.id === estadoPatching.srcHw);

      conexoesAtivas.push({
        id: `link-${conexaoCounter++}`,
        srcId: estadoPatching.srcHw,
        srcPort: estadoPatching.srcPort,
        dstId: hwId,
        dstPort: portNum,
        color: corCabo
      });

      const absSrc = eqOrigem.offset + estadoPatching.srcPort;
      const absDst = eqTarget.offset + portNum;
      writeLog(`Patching via Clique: ${eqOrigem.label} (Abs: ${absSrc}) ⟷ ${eqTarget.label} (Abs: ${absDst})`);

      estadoPatching = { srcHw: null, srcPort: null };
      renderizarHardware();
      popularPortas('origem');
      popularPortas('destino');
    }
  });
}

/**
 * Atualiza os dropdowns de seleção de hardware na sidebar.
 * Reflete o estado atual do rackState.
 */
function atualizarDropdownsUI() {
  const selSrcHw = document.getElementById('selOrigemHw');
  const selDstHw = document.getElementById('selDestinoHw');

  selSrcHw.innerHTML = '<option value="">Origem...</option>';
  selDstHw.innerHTML = '<option value="">Destino...</option>';

  rackState.forEach(eq => {
    const opt = `<option value="${eq.id}">${eq.label} (${eq.u}U)</option>`;
    selSrcHw.innerHTML += opt;
    selDstHw.innerHTML += opt;
  });

  document.getElementById('selOrigemPorta').innerHTML = '<option value="">Porta...</option>';
  document.getElementById('selDestinoPorta').innerHTML = '<option value="">Porta...</option>';
}

/**
 * Popula o dropdown de portas com base no hardware selecionado.
 * Marca portas já ocupadas como desabilitadas.
 * @param {string} alvo - 'origem' ou 'destino'.
 */
function popularPortas(alvo) {
  const hwId = alvo === 'origem'
    ? document.getElementById('selOrigemHw').value
    : document.getElementById('selDestinoHw').value;
  const selPorta = alvo === 'origem'
    ? document.getElementById('selOrigemPorta')
    : document.getElementById('selDestinoPorta');

  selPorta.innerHTML = '<option value="">Porta...</option>';
  if (!hwId) return;

  const eq = rackState.find(e => e.id === hwId);
  for (let i = 1; i <= eq.portas; i++) {
    const ocupada = conexoesAtivas.some(c =>
      (c.srcId === hwId && c.srcPort == i) ||
      (c.dstId === hwId && c.dstPort == i)
    );
    const disableFlag = ocupada ? 'disabled' : '';
    const textSuffix = ocupada ? ' (Ocupada)' : '';
    const isSFP = eq.tipo === 'switch' && i > 48;
    const portLabel = isSFP ? `SFP+ ${i - 48} (Porta ${i})` : `Porta Local ${i}`;
    selPorta.innerHTML += `<option value="${i}" ${disableFlag}>${portLabel}${textSuffix}</option>`;
  }
}

/**
 * Cria uma conexão manual usando os valores dos dropdowns da sidebar.
 */
function criarConexaoManual() {
  const srcId = document.getElementById('selOrigemHw').value;
  const srcPort = parseInt(document.getElementById('selOrigemPorta').value);
  const dstId = document.getElementById('selDestinoHw').value;
  const dstPort = parseInt(document.getElementById('selDestinoPorta').value);
  const color = document.getElementById('selCorCabo').value;

  if (!srcId || !srcPort || !dstId || !dstPort) return;
  if (srcId === dstId && srcPort === dstPort) return;

  conexoesAtivas.push({
    id: `link-${conexaoCounter++}`,
    srcId: srcId, srcPort: srcPort,
    dstId: dstId, dstPort: dstPort,
    color: color
  });

  renderizarHardware();
  popularPortas('origem');
  popularPortas('destino');
}
