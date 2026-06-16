/* ============================================
   CABLE-RENDERER.JS - Motor Vetorial SVG de Cabos
   ============================================ */

function obterOffsetPorta(hwId, portaNum) {
  const eq = rackState.find(e => e.id === hwId);
  if (!eq) return 15;
  if (eq.tipo === 'switch') {
    // Portas 1-24 estão na fileira de cima -> cabo sai para cima (-15)
    // Portas 25-48 estão na fileira de baixo -> cabo sai para baixo (+15)
    // Portas SFP+ (49-52) estão na fileira de baixo -> cabo sai para baixo (+15)
    return portaNum <= 24 ? -15 : 15;
  }
  // Para patch panel, a etiqueta/identificação fica acima das portas,
  // então fazer os cabos saírem para baixo (+15) evita cobrir as etiquetas
  return 15;
}

function processarCabeamento() {
  const svg = document.getElementById('svgCables');
  Array.from(svg.children).forEach(c => {
    if (c.tagName.toLowerCase() !== 'defs') svg.removeChild(c);
  });

  const rackFrame = document.getElementById('rackFrame');
  const rSvg = svg.getBoundingClientRect();
  const centroRackX = rSvg.width / 2;

  conexoesAtivas.forEach(conexao => {
    const pSrc = rackFrame.querySelector(`#${conexao.srcId} .port-rj45[data-port-local="${conexao.srcPort}"]`);
    const pDst = rackFrame.querySelector(`#${conexao.dstId} .port-rj45[data-port-local="${conexao.dstPort}"]`);

    if (pSrc && pDst) {
      const rSrc = pSrc.getBoundingClientRect();
      const rDst = pDst.getBoundingClientRect();

      // Coordenadas calculadas em relação ao próprio container SVG (evita qualquer offset/desalinhamento)
      const x1 = (rSrc.left + rSrc.width / 2) - rSvg.left;
      const y1 = (rSrc.top + rSrc.height / 2) - rSvg.top;
      const x2 = (rDst.left + rDst.width / 2) - rSvg.left;
      const y2 = (rDst.top + rDst.height / 2) - rSvg.top;

      // Determinar o lado de organização para cada porta
      const usaLadoEsquerdo1 = x1 < centroRackX;
      const usaLadoEsquerdo2 = x2 < centroRackX;

      // Calcular canal vertical para a origem (em relação ao próprio SVG)
      const margemGuia1 = usaLadoEsquerdo1 ? 25 : rSvg.width - 25;
      const bundleOffset1 = (conexao.srcPort % 8) * (usaLadoEsquerdo1 ? 1.5 : -1.5);
      const calcBundleX1 = margemGuia1 + bundleOffset1;

      // Se as portas estão no mesmo lado, use o mesmo canal vertical para evitar cruzamento diagonal na descida
      let calcBundleX2;
      if (usaLadoEsquerdo1 === usaLadoEsquerdo2) {
        calcBundleX2 = calcBundleX1;
      } else {
        const margemGuia2 = usaLadoEsquerdo2 ? 25 : rSvg.width - 25;
        const bundleOffset2 = (conexao.dstPort % 8) * (usaLadoEsquerdo2 ? 1.5 : -1.5);
        calcBundleX2 = margemGuia2 + bundleOffset2;
      }

      // Direção de saída vertical (evita passar na frente das portas)
      const dy1 = obterOffsetPorta(conexao.srcId, conexao.srcPort);
      const dy2 = obterOffsetPorta(conexao.dstId, conexao.dstPort);

      // Particionar o offset em trecho reto e trecho curvo para garantir saída/entrada perpendiculares perfeitas
      const dy_vert1 = dy1 * 0.5;
      const dy_bend1 = dy1 * 0.5;
      const dy_vert2 = dy2 * 0.5;
      const dy_bend2 = dy2 * 0.5;

      let pathData;
      if (usaLadoEsquerdo1 === usaLadoEsquerdo2) {
        // Caso padrão: mesmo lado
        pathData = `M ${x1} ${y1} ` +
                   `L ${x1} ${y1 + dy_vert1} ` +
                   `C ${x1} ${y1 + dy_vert1 + dy_bend1 * 0.5}, ${calcBundleX1} ${y1 + dy1 - dy_bend1 * 0.5}, ${calcBundleX1} ${y1 + dy1} ` +
                   `L ${calcBundleX1} ${y2 + dy2} ` +
                   `C ${calcBundleX1} ${y2 + dy2 - dy_bend2 * 0.5}, ${x2} ${y2 + dy_vert2 + dy_bend2 * 0.5}, ${x2} ${y2 + dy_vert2} ` +
                   `L ${x2} ${y2}`;
      } else {
        // Caso especial: lados opostos (cruza pelo meio da altura de forma organizada)
        const yMid = (y1 + dy1 + y2 + dy2) / 2;
        pathData = `M ${x1} ${y1} ` +
                   `L ${x1} ${y1 + dy_vert1} ` +
                   `C ${x1} ${y1 + dy_vert1 + dy_bend1 * 0.5}, ${calcBundleX1} ${y1 + dy1 - dy_bend1 * 0.5}, ${calcBundleX1} ${y1 + dy1} ` +
                   `L ${calcBundleX1} ${yMid} ` +
                   `L ${calcBundleX2} ${yMid} ` +
                   `L ${calcBundleX2} ${y2 + dy2} ` +
                   `C ${calcBundleX2} ${y2 + dy2 - dy_bend2 * 0.5}, ${x2} ${y2 + dy_vert2 + dy_bend2 * 0.5}, ${x2} ${y2 + dy_vert2} ` +
                   `L ${x2} ${y2}`;
      }

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('class', 'cable-path');
      path.setAttribute('data-link-ref', conexao.id);
      path.setAttribute('stroke', conexao.color);
      path.setAttribute('stroke-width', '4');
      svg.appendChild(path);
    }
  });
}
