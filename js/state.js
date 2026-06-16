/* ============================================
   STATE.JS - Estado Global da Aplicação
   Enterprise Network Rack Suite 3D - Routing Engine V4.1
   
   Centraliza todas as variáveis de estado mutável
   que são compartilhadas entre os módulos.
   ============================================ */

/** @type {Array<Object>} Lista de equipamentos instalados no rack */
let rackState = [];

/** @type {Array<Object>} Lista de conexões ativas (cabos) */
let conexoesAtivas = [];

/** @type {number} Total de slots U disponíveis no rack */
const totalSlotsU = 16;

/** @type {number} Contador incremental para IDs de conexão */
let conexaoCounter = 1;

/** @type {Object} Estado da operação de patching interativo (clique-a-clique) */
let estadoPatching = { srcHw: null, srcPort: null };

/** @type {number} Capacidade global acumulada de Patch Panels (offset contínuo) */
let globalPPCapacity = 0;

/** @type {number} Capacidade global acumulada de Switches (offset contínuo) */
let globalSWCapacity = 0;
