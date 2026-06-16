/* ============================================
   LOGGER.JS - Módulo de Terminal / Log
   Enterprise Network Rack Suite 3D - Routing Engine V4.1
   
   Responsável por escrever mensagens timestamped
   no terminal visual da sidebar.
   ============================================ */

/**
 * Escreve uma mensagem com timestamp no terminal de log da UI.
 * @param {string} msg - Mensagem a ser exibida.
 */
function writeLog(msg) {
  const log = document.getElementById('logTerminal');
  const timestamp = new Date().toLocaleTimeString('pt-BR', { hour12: false });
  log.innerHTML += `[${timestamp}] ${msg}<br>`;
}
