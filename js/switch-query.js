/* ============================================
   SWITCH-QUERY.JS - Motor de Consulta Automatizada
   Enterprise Network Rack Suite 3D - Routing Engine V4.1
   
   Simula consultas SSH ao switch e exibe resultados
   nos cards do Dashboard. Para produção, substituir
   os dados simulados por chamadas reais via backend proxy.
   ============================================ */

/** Estado da conexão SSH */
let sshState = { connected: false, host: '', user: '' };

/* =============================================
   DADOS SIMULADOS DO SWITCH (Extreme 4220 Series)
   Switch Engine (ExtremeXOS) - Em produção,
   substituir por fetch() a um backend SSH real.
   ============================================= */

function gerarDadosSistema() {
  const modelSelected = '4220-48P-4X';
  const firmwares = ['32.7.1.5', '32.6.2.3', '32.5.1.8', '32.4.1.2'];
  const idx = Math.floor(Math.random() * firmwares.length);
  const days = Math.floor(Math.random() * 120) + 5;
  const hrs = Math.floor(Math.random() * 24);
  const mins = Math.floor(Math.random() * 60);
  return {
    modelo: modelSelected,
    serial: '80' + Math.random().toString(36).substring(2, 12).toUpperCase(),
    firmware: 'Switch Engine ' + firmwares[idx],
    mac: gerarMAC(),
    uptime: `${days}d ${hrs}h ${mins}m`,
    uptimeDays: days,
    fontePrimaria: Math.random() > 0.05 ? 'OK' : 'FALHA',
    fonteRedundante: Math.random() > 0.7 ? 'OK' : 'N/A',
    temperatura: Math.floor(Math.random() * 20) + 30,
    ventiladores: Math.random() > 0.1 ? 'Normal' : 'Alerta'
  };
}

function gerarDadosHardware() {
  return {
    cpuPercent: Math.floor(Math.random() * 55) + 5,
    ramTotal: 512,
    ramUsed: Math.floor(Math.random() * 280) + 80,
  };
}

function gerarMAC() {
  return 'XX:XX:XX:XX:XX:XX'.replace(/X/g, () =>
    '0123456789ABCDEF'[Math.floor(Math.random() * 16)]
  );
}

function gerarDadosPortas() {
  const portas = [];
  const totalPortas = 52; // 48 x 1000BASE-T + 4 x 10G SFP+
  for (let i = 1; i <= totalPortas; i++) {
    const isSFP = i > 48;
    const roll = Math.random();
    let status, speed, duplex, errors;
    if (roll < 0.55) {
      status = 'Active';
      if (isSFP) {
        speed = Math.random() > 0.3 ? '10G' : '1G';
      } else {
        const speeds = ['100M', '1000M'];
        speed = speeds[Math.floor(Math.random() * 2)];
      }
      duplex = 'Full';
      errors = Math.random() > 0.9 ? Math.floor(Math.random() * 50) : 0;
    } else if (roll < 0.9) {
      status = 'Ready';
      speed = '-';
      duplex = '-';
      errors = 0;
    } else {
      status = 'Disabled';
      speed = '-';
      duplex = '-';
      errors = 0;
    }
    portas.push({
      porta: i,
      tipo: isSFP ? '10G SFP+' : '1000BASE-T',
      status, speed, duplex,
      txErrors: errors,
      rxErrors: Math.random() > 0.92 ? Math.floor(Math.random() * 30) : 0
    });
  }
  return portas;
}

function gerarDadosVLANs() {
  const nomes = ['Default', 'Mgmt', 'Servidores', 'WiFi_Corp', 'IoT', 'CFTV', 'VoIP', 'DMZ'];
  const vlans = [];
  const count = Math.floor(Math.random() * 4) + 4;
  for (let i = 0; i < count && i < nomes.length; i++) {
    const id = i === 0 ? 1 : (i * 10 + Math.floor(Math.random() * 5));
    const ports = [];
    const numPorts = Math.floor(Math.random() * 12) + 2;
    for (let p = 0; p < numPorts; p++) {
      const pn = Math.floor(Math.random() * 52) + 1;
      if (!ports.includes(pn)) ports.push(pn);
    }
    ports.sort((a, b) => a - b);
    vlans.push({
      id,
      nome: nomes[i],
      ip: i === 0 ? '192.168.1.1' : `10.${id}.${Math.floor(Math.random() * 5)}.1`,
      mask: '255.255.255.0',
      tagged: ports.slice(0, Math.floor(ports.length / 2)),
      untagged: ports.slice(Math.floor(ports.length / 2)),
      status: 'Ativa'
    });
  }
  return vlans;
}

function gerarDadosMAC() {
  const entries = [];
  const count = Math.floor(Math.random() * 25) + 10;
  const vlans = [1, 10, 20, 30, 40, 50];
  for (let i = 0; i < count; i++) {
    entries.push({
      mac: gerarMAC(),
      porta: Math.floor(Math.random() * 52) + 1,
      vlan: vlans[Math.floor(Math.random() * vlans.length)],
      tipo: Math.random() > 0.15 ? 'Dinâmico' : 'Estático'
    });
  }
  return entries;
}

function gerarDadosPoE() {
  const budget = 740; // Watts - budget total do 4220-48P-4X
  let totalUsed = 0;
  const ports = [];
  // Portas 1-48 do 4220-48P-4X tem suporte a PoE+
  for (let i = 1; i <= 48; i++) {
    const powered = Math.random() > 0.45;
    const watts = powered ? Math.round((Math.random() * 22 + 4.2) * 10) / 10 : 0;
    totalUsed += watts;
    ports.push({
      porta: i,
      classe: powered ? `Class ${Math.floor(Math.random() * 4) + 1}` : '-',
      consumo: watts,
      status: powered ? 'Delivering' : 'Searching'
    });
  }
  return { budget, used: Math.round(totalUsed * 10) / 10, ports };
}

function gerarDadosLLDP() {
  const neighbors = [];
  const tipos = ['AP-510 (Extreme AP)', 'AP-305 (Extreme AP)', 'IP Phone 7945', 'Desktop-Dell', 'HP-LaserJet', 'Cisco-IP-Cam'];
  for (let i = 1; i <= 52; i++) {
    if (Math.random() > 0.65) {
      neighbors.push({
        portaLocal: i,
        dispositivo: tipos[Math.floor(Math.random() * tipos.length)],
        macRemoto: gerarMAC(),
        ipRemoto: `10.100.${Math.floor(Math.random()*10)+10}.${Math.floor(Math.random()*254)+1}`,
        descricao: `ExtremeSwitching LLDP Neighbor on Port ${i}`
      });
    }
  }
  return neighbors;
}

function gerarDadosStacking() {
  const switches = rackState.filter(eq => eq.tipo === 'switch');
  const stackMembers = [];
  
  switches.forEach((sw, index) => {
    const isMaster = index === 0;
    const isBackup = index === 1;
    const role = isMaster ? 'Master' : isBackup ? 'Backup' : 'Standby';
    
    stackMembers.push({
      slot: index + 1,
      role: role,
      mac: gerarMAC(),
      status: 'Active',
      modelo: '4220-48P-4X',
      prioridade: isMaster ? 100 : isBackup ? 90 : 50
    });
  });
  
  if (stackMembers.length === 0) {
    stackMembers.push({
      slot: 1,
      role: 'Master',
      mac: gerarMAC(),
      status: 'Active',
      modelo: '4220-48P-4X',
      prioridade: 100
    });
  }
  
  return {
    enabled: true,
    activeMembers: stackMembers.length,
    topology: 'Ring',
    members: stackMembers
  };
}

function gerarLogs() {
  const msgs = [
    { sev: 'INFO', msg: 'Port 12 link state up at speed 1000 Mbps, duplex full' },
    { sev: 'WARNING', msg: 'Port 33 link state down' },
    { sev: 'INFO', msg: 'User admin login from 192.168.1.100 via SSH' },
    { sev: 'WARNING', msg: 'CPU utilization threshold exceeded: 70%' },
    { sev: 'CRITICAL', msg: 'PSU-2 power supply failure detected' },
    { sev: 'INFO', msg: 'Port 5 link state up at speed 100 Mbps, duplex full' },
    { sev: 'INFO', msg: 'Configuration saved to primary.cfg by admin' },
    { sev: 'WARNING', msg: 'Temperature sensor reading 48°C exceeded threshold' },
    { sev: 'INFO', msg: 'Port 24 link state down' },
    { sev: 'INFO', msg: 'SNTP time synchronized to NTP server' },
    { sev: 'WARNING', msg: 'FDB table full on VLAN Mgmt (ID 10)' },
    { sev: 'INFO', msg: 'Switch Engine firmware up to date: 32.7.1.5' },
    { sev: 'CRITICAL', msg: 'Fan-2 speed below minimum RPM threshold' },
    { sev: 'INFO', msg: 'Port 49 SFP+ transceiver inserted (10GBASE-SR)' },
    { sev: 'WARNING', msg: 'Authentication failure from 10.0.0.55 via SSH' },
    { sev: 'INFO', msg: 'LLDP neighbor discovered on port 12: AP-510' },
    { sev: 'INFO', msg: 'Inline power allocated on port 8: 15.4W (Class 3)' },
  ];
  const logs = [];
  const count = Math.floor(Math.random() * 8) + 8;
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const entry = msgs[Math.floor(Math.random() * msgs.length)];
    const offset = i * (Math.floor(Math.random() * 3600000) + 60000);
    logs.push({
      timestamp: new Date(now - offset).toLocaleString('pt-BR'),
      severity: entry.sev,
      message: entry.msg
    });
  }
  return logs;
}

/* =============================================
   FUNÇÕES DE RENDERIZAÇÃO DOS RESULTADOS
   ============================================= */

function renderSistema(data) {
  const container = document.getElementById('resultSistema');
  const tempClass = data.temperatura > 45 ? 'badge-warn' : 'badge-up';
  const fonteClass = data.fontePrimaria === 'OK' ? 'badge-up' : 'badge-down';
  container.innerHTML = `
    <div class="info-grid">
      <div class="info-item">
        <span class="info-item-label">Modelo</span>
        <span class="info-item-value">${data.modelo}</span>
      </div>
      <div class="info-item">
        <span class="info-item-label">Nº Série</span>
        <span class="info-item-value" style="font-family:monospace;font-size:12px">${data.serial}</span>
      </div>
      <div class="info-item">
        <span class="info-item-label">Firmware</span>
        <span class="info-item-value">${data.firmware}</span>
      </div>
      <div class="info-item">
        <span class="info-item-label">Uptime</span>
        <span class="info-item-value uptime">⏱ ${data.uptime}</span>
      </div>
      <div class="info-item">
        <span class="info-item-label">MAC do Switch</span>
        <span class="info-item-value mac-address">${data.mac}</span>
      </div>
      <div class="info-item">
        <span class="info-item-label">Temperatura</span>
        <span class="info-item-value"><span class="badge ${tempClass}">${data.temperatura}°C</span></span>
      </div>
      <div class="info-item">
        <span class="info-item-label">Fonte Primária</span>
        <span class="info-item-value"><span class="badge ${fonteClass}">${data.fontePrimaria}</span></span>
      </div>
      <div class="info-item">
        <span class="info-item-label">Ventiladores</span>
        <span class="info-item-value"><span class="badge ${data.ventiladores === 'Normal' ? 'badge-up' : 'badge-warn'}">${data.ventiladores}</span></span>
      </div>
    </div>`;
}

function renderHardware(data) {
  const container = document.getElementById('resultHardware');
  const cpuClass = data.cpuPercent < 40 ? 'low' : data.cpuPercent < 70 ? 'medium' : 'high';
  const ramPercent = Math.round((data.ramUsed / data.ramTotal) * 100);
  const ramClass = ramPercent < 50 ? 'low' : ramPercent < 80 ? 'medium' : 'high';
  container.innerHTML = `
    <div class="metric-row">
      <span class="metric-label">CPU</span>
      <div class="progress-bar-container">
        <div class="progress-bar-fill ${cpuClass}" style="width:${data.cpuPercent}%"></div>
      </div>
      <span class="metric-value">${data.cpuPercent}%</span>
    </div>
    <div class="metric-row">
      <span class="metric-label">RAM</span>
      <div class="progress-bar-container">
        <div class="progress-bar-fill ${ramClass}" style="width:${ramPercent}%"></div>
      </div>
      <span class="metric-value">${data.ramUsed}/${data.ramTotal}MB</span>
    </div>`;
}

function renderPortas(data) {
  const container = document.getElementById('resultPortas');
  const up = data.filter(p => p.status === 'Active').length;
  const down = data.filter(p => p.status === 'Ready').length;
  const dis = data.filter(p => p.status === 'Disabled').length;

  let visualMap = '<div class="port-visual-map">';
  data.forEach(p => {
    const cls = p.status === 'Active' ? 'up' : p.status === 'Ready' ? 'down' : 'disabled';
    const tip = `Porta ${p.porta}: ${p.status}${p.speed !== '-' ? ' | ' + p.speed : ''}`;
    visualMap += `<div class="port-visual-cell ${cls}" data-tooltip="${tip}">${p.porta}</div>`;
  });
  visualMap += '</div>';

  let rows = '';
  data.forEach(p => {
    const cls = p.status === 'Active' ? 'badge-up' : p.status === 'Ready' ? 'badge-down' : 'badge-disabled';
    const errClass = (p.txErrors > 0 || p.rxErrors > 0) ? 'style="color:#f87171;font-weight:700"' : '';
    rows += `<tr>
      <td>${p.porta}</td>
      <td>${p.tipo}</td>
      <td><span class="badge ${cls}">${p.status}</span></td>
      <td>${p.speed}</td>
      <td>${p.duplex}</td>
      <td ${errClass}>${p.txErrors} / ${p.rxErrors}</td>
    </tr>`;
  });

  container.innerHTML = `
    <div class="port-summary-bar">
      <div class="port-counter"><span class="port-counter-num up">${up}</span><span class="port-counter-label">Active</span></div>
      <div class="port-counter"><span class="port-counter-num down">${down}</span><span class="port-counter-label">Ready</span></div>
      <div class="port-counter"><span class="port-counter-num disabled">${dis}</span><span class="port-counter-label">Disabled</span></div>
    </div>
    ${visualMap}
    <div style="max-height:260px;overflow-y:auto;margin-top:12px">
    <table class="result-table">
      <thead><tr><th>Porta</th><th>Tipo</th><th>Status</th><th>Speed</th><th>Duplex</th><th>TX/RX Erros</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}

function renderVLANs(data) {
  const container = document.getElementById('resultVLANs');
  let rows = '';
  data.forEach(v => {
    const tagPorts = v.tagged.length > 0 ? v.tagged.join(', ') : '-';
    const untagPorts = v.untagged.length > 0 ? v.untagged.join(', ') : '-';
    rows += `<tr>
      <td><span class="vlan-tag">VLAN ${v.id}</span></td>
      <td style="font-weight:600">${v.nome}</td>
      <td style="font-family:monospace;font-size:11px">${v.ip}/${v.mask}</td>
      <td style="font-size:11px">${tagPorts}</td>
      <td style="font-size:11px">${untagPorts}</td>
      <td><span class="badge badge-up">${v.status}</span></td>
    </tr>`;
  });
  container.innerHTML = `
    <div style="max-height:300px;overflow-y:auto">
    <table class="result-table">
      <thead><tr><th>ID</th><th>Nome</th><th>IP / Máscara</th><th>Tagged</th><th>Untagged</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}

function renderMAC(data) {
  const container = document.getElementById('resultMAC');
  let rows = '';
  data.forEach(e => {
    rows += `<tr>
      <td><span class="mac-address">${e.mac}</span></td>
      <td>Porta ${e.porta}</td>
      <td><span class="vlan-tag">VLAN ${e.vlan}</span></td>
      <td><span class="badge ${e.tipo === 'Dinâmico' ? 'badge-info' : 'badge-warn'}">${e.tipo}</span></td>
    </tr>`;
  });
  container.innerHTML = `
    <p style="font-size:11px;color:var(--text-dim);margin-bottom:8px">Total: ${data.length} entradas na tabela FDB</p>
    <div style="max-height:280px;overflow-y:auto">
    <table class="result-table">
      <thead><tr><th>Endereço MAC</th><th>Porta</th><th>VLAN</th><th>Tipo</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}

function renderLogs(data) {
  const container = document.getElementById('resultLogs');
  let html = '<div style="max-height:300px;overflow-y:auto">';
  data.forEach(l => {
    const sevClass = l.severity === 'CRITICAL' ? 'badge-down' : l.severity === 'WARNING' ? 'badge-warn' : 'badge-info';
    html += `<div class="log-entry">
      <span class="log-timestamp">${l.timestamp}</span>
      <span class="log-severity"><span class="badge ${sevClass}">${l.severity}</span></span>
      <span class="log-message">${l.message}</span>
    </div>`;
  });
  html += '</div>';
  container.innerHTML = html;
}

function renderPoE(data) {
  const container = document.getElementById('resultPoE');
  const pct = Math.min(Math.round((data.used / data.budget) * 100), 100);
  const pClass = pct < 50 ? 'low' : pct < 85 ? 'medium' : 'high';

  let rows = '';
  data.ports.forEach(p => {
    if (p.status === 'Delivering') {
      rows += `<tr>
        <td>Porta ${p.porta}</td>
        <td><span class="badge badge-up">${p.status}</span></td>
        <td>${p.classe}</td>
        <td><span style="font-weight:600">${p.consumo} W</span></td>
      </tr>`;
    }
  });

  container.innerHTML = `
    <div class="metric-row" style="margin-bottom:16px">
      <span class="metric-label" style="min-width:100px">Consumo PoE</span>
      <div class="progress-bar-container">
        <div class="progress-bar-fill ${pClass}" style="width:${pct}%"></div>
      </div>
      <span class="metric-value" style="min-width:120px">${data.used} / ${data.budget}W (${pct}%)</span>
    </div>
    <div style="max-height:220px;overflow-y:auto">
    <table class="result-table">
      <thead><tr><th>Porta</th><th>Status</th><th>Classe</th><th>Consumo</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}

function renderLLDP(data) {
  const container = document.getElementById('resultLLDP');
  let rows = '';
  data.forEach(n => {
    rows += `<tr>
      <td>Porta ${n.portaLocal}</td>
      <td style="font-weight:600">${n.dispositivo}</td>
      <td style="font-family:monospace;font-size:11px">${n.ipRemoto}</td>
      <td class="mac-address">${n.macRemoto}</td>
    </tr>`;
  });

  container.innerHTML = `
    <div style="max-height:260px;overflow-y:auto">
    <table class="result-table">
      <thead><tr><th>Porta Local</th><th>Dispositivo Remoto</th><th>Endereço IP</th><th>Endereço MAC</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}

function renderStacking(data) {
  const container = document.getElementById('resultStacking');
  let rows = '';
  data.members.forEach(m => {
    const roleClass = m.role === 'Master' ? 'badge-down' : m.role === 'Backup' ? 'badge-warn' : 'badge-info';
    rows += `<tr>
      <td>Slot ${m.slot}</td>
      <td><span class="badge ${roleClass}">${m.role}</span></td>
      <td>${m.modelo}</td>
      <td class="mac-address">${m.mac}</td>
      <td>Prioridade ${m.prioridade}</td>
      <td><span class="badge badge-up">${m.status}</span></td>
    </tr>`;
  });
  
  container.innerHTML = `
    <div style="font-size:11px;color:var(--text-dim);margin-bottom:8px;display:flex;justify-content:space-between">
      <span>Topologia: <strong style="color:var(--text-main)">${data.topology}</strong></span>
      <span>Membros Ativos: <strong style="color:var(--text-main)">${data.activeMembers}</strong></span>
    </div>
    <div style="max-height:260px;overflow-y:auto">
    <table class="result-table">
      <thead><tr><th>Slot</th><th>Role</th><th>Modelo</th><th>MAC Address</th><th>Prioridade</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>`;
}

/* =============================================
   FUNÇÕES DE CONTROLE (BOTÕES)
   ============================================= */

function simularDelay() {
  return new Promise(r => setTimeout(r, 600 + Math.random() * 900));
}

async function setBtnLoading(btnId, loading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  if (loading) {
    btn.classList.add('loading');
    btn.disabled = true;
  } else {
    btn.classList.remove('loading');
    btn.disabled = false;
  }
}

function toggleConexao() {
  const host = document.getElementById('sshHost').value.trim();
  const user = document.getElementById('sshUser').value.trim();

  if (sshState.connected) {
    sshState = { connected: false, host: '', user: '' };
    document.getElementById('btnConectar').textContent = '🔌 Conectar';
    document.getElementById('btnConectar').classList.remove('connected');
    document.getElementById('statusDot').classList.remove('online');
    document.getElementById('statusText').textContent = 'Desconectado';
    writeLog('SSH: Sessão encerrada.');
    return;
  }

  if (!host) { writeLog('Erro: Informe o IP do switch.'); return; }
  sshState = { connected: true, host, user: user || 'admin' };
  document.getElementById('btnConectar').textContent = '⛔ Desconectar';
  document.getElementById('btnConectar').classList.add('connected');
  document.getElementById('statusDot').classList.add('online');
  document.getElementById('statusText').textContent = `Conectado a ${host}`;
  writeLog(`SSH: Conexão estabelecida com ${host} (user: ${sshState.user})`);
}

function checkConnection() {
  if (!sshState.connected) {
    writeLog('Erro: Conecte-se ao switch antes de executar consultas.');
    return false;
  }
  return true;
}

async function querySistema() {
  if (!checkConnection()) return;
  setBtnLoading('btnSistema', true);
  writeLog('Executando: show version + show switch ...');
  await simularDelay();
  renderSistema(gerarDadosSistema());
  writeLog('Relatório do Sistema carregado com sucesso.');
  setBtnLoading('btnSistema', false);
}

async function queryHardware() {
  if (!checkConnection()) return;
  setBtnLoading('btnHardware', true);
  writeLog('Executando: show cpu-monitoring + show memory ...');
  await simularDelay();
  renderHardware(gerarDadosHardware());
  writeLog('Desempenho de Hardware carregado.');
  setBtnLoading('btnHardware', false);
}

async function queryPortas() {
  if (!checkConnection()) return;
  setBtnLoading('btnPortas', true);
  writeLog('Executando: show ports no-refresh ...');
  await simularDelay();
  renderPortas(gerarDadosPortas());
  writeLog('Visão Geral das Portas carregada.');
  setBtnLoading('btnPortas', false);
}

async function queryVLANs() {
  if (!checkConnection()) return;
  setBtnLoading('btnVLANs', true);
  writeLog('Executando: show vlan ...');
  await simularDelay();
  renderVLANs(gerarDadosVLANs());
  writeLog('Mapeamento de VLANs carregado.');
  setBtnLoading('btnVLANs', false);
}

async function queryMAC() {
  if (!checkConnection()) return;
  setBtnLoading('btnMAC', true);
  writeLog('Executando: show fdb ...');
  await simularDelay();
  renderMAC(gerarDadosMAC());
  writeLog('Tabela de Dispositivos (FDB) carregada.');
  setBtnLoading('btnMAC', false);
}

async function queryLogs() {
  if (!checkConnection()) return;
  setBtnLoading('btnLogs', true);
  writeLog('Executando: show log ...');
  await simularDelay();
  renderLogs(gerarLogs());
  writeLog('Logs de Eventos coletados.');
  setBtnLoading('btnLogs', false);
}

async function queryPoE() {
  if (!checkConnection()) return;
  setBtnLoading('btnPoE', true);
  writeLog('Executando: show inline-power ...');
  await simularDelay();
  renderPoE(gerarDadosPoE());
  writeLog('Status PoE carregado.');
  setBtnLoading('btnPoE', false);
}

async function queryLLDP() {
  if (!checkConnection()) return;
  setBtnLoading('btnLLDP', true);
  writeLog('Executando: show lldp neighbors ...');
  await simularDelay();
  renderLLDP(gerarDadosLLDP());
  writeLog('Vizinhança LLDP mapeada.');
  setBtnLoading('btnLLDP', false);
}

async function queryStacking() {
  if (!checkConnection()) return;
  setBtnLoading('btnStacking', true);
  writeLog('Executando: show stacking ...');
  await simularDelay();
  renderStacking(gerarDadosStacking());
  writeLog('Informações de Stacking carregadas.');
  setBtnLoading('btnStacking', false);
}

async function executarVarreduraCompleta() {
  if (!checkConnection()) return;
  const btn = document.getElementById('btnFullScan');
  const progress = document.getElementById('scanProgress');
  const fill = document.getElementById('scanProgressFill');
  const text = document.getElementById('scanProgressText');

  btn.disabled = true;
  progress.classList.add('active');

  const steps = [
    { fn: querySistema, label: 'Coletando dados do sistema...', pct: 11 },
    { fn: queryHardware, label: 'Verificando hardware...', pct: 22 },
    { fn: queryPortas, label: 'Escaneando portas...', pct: 33 },
    { fn: queryVLANs, label: 'Mapeando VLANs...', pct: 44 },
    { fn: queryPoE, label: 'Verificando consumo PoE...', pct: 55 },
    { fn: queryMAC, label: 'Consultando tabela MAC/FDB...', pct: 66 },
    { fn: queryLLDP, label: 'Varrendo vizinhança LLDP...', pct: 77 },
    { fn: queryStacking, label: 'Verificando empilhamento...', pct: 88 },
    { fn: queryLogs, label: 'Coletando logs...', pct: 100 },
  ];

  for (const step of steps) {
    text.textContent = step.label;
    fill.style.width = step.pct + '%';
    await step.fn();
  }

  text.textContent = '✅ Varredura completa finalizada!';
  writeLog('🚀 Varredura completa finalizada com sucesso.');
  setTimeout(() => {
    progress.classList.remove('active');
    fill.style.width = '0%';
    btn.disabled = false;
  }, 3000);
}

/* =============================================
   NAVEGAÇÃO ENTRE ABAS
   ============================================= */

function switchView(viewName) {
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.nav-tab[data-view="${viewName}"]`).classList.add('active');

  document.querySelector('.rack-view').classList.toggle('active', viewName === 'rack');
  document.querySelector('.dashboard-view').classList.toggle('active', viewName === 'dashboard');
}
