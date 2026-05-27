/**
 * TIKTOK ARENA DO CAOS — Servidor SaaS
 * Multi-usuários dinâmico. Aceita conexões WS com /?user=xxx
 */

const { WebcastPushConnection } = require('tiktok-live-connector');
const WebSocket = require('ws');
const express = require('express');
const path = require('path');
const http = require('http');

// ─── CONFIG ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
// ───────────────────────────────────────────────────────────────────────────

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Estado Global de Multi-tenant
const activeTiktokConnections = new Map(); // username -> WebcastPushConnection
const activeClients = new Map();           // username -> Set<WebSocket>

wss.on('connection', (ws, req) => {
  let user = 'demo';
  let game = 'arena';
  if (req.url.includes('?')) {
    const urlParams = new URLSearchParams(req.url.split('?')[1]);
    user = urlParams.get('user') || 'demo';
    game = urlParams.get('game') || 'arena';
  }

  console.log(`[WS] Novo cliente conectado em @${user} (Jogo: ${game})`);
  
  if (!activeClients.has(user)) {
    activeClients.set(user, new Set());
  }
  activeClients.get(user).add(ws);

  ws.on('close', () => {
    console.log(`[WS] Cliente saiu da arena de: @${user}`);
    const clients = activeClients.get(user);
    if (clients) {
      clients.delete(ws);
      if (clients.size === 0) {
        console.log(`[SYS] Arena de @${user} vazia. Desconectando do TikTok para poupar recursos...`);
        const tk = activeTiktokConnections.get(user);
        if (tk) {
          tk.disconnect();
          activeTiktokConnections.delete(user);
        }
        activeClients.delete(user);
      }
    }
  });

  startTikTokConnection(user);
});

function broadcast(user, payload) {
  const clients = activeClients.get(user);
  if (clients) {
    const msg = JSON.stringify(payload);
    clients.forEach(c => {
      if (c.readyState === WebSocket.OPEN) c.send(msg);
    });
  }
}

// ─── TIKTOK LIVE (Dinâmico) ────────────────────────────────────────────────
function startTikTokConnection(user) {
  if (user === 'demo' || !user) {
    startDemoMode();
    return;
  }

  if (activeTiktokConnections.has(user)) return; // Já estamos escutando esse usuário

  console.log(`[TIKTOK] 🔌 Conectando à live de @${user}...`);
  const tiktok = new WebcastPushConnection(user, {
    processInitialData: false,
    fetchRoomInfoOnConnect: true,
    enableExtendedGiftInfo: true,
  });

  activeTiktokConnections.set(user, tiktok);

  tiktok.connect()
    .then(state => {
      console.log(`[TIKTOK] ✅ Live @${user} conectada! Room ID: ${state.roomId}`);
    })
    .catch(err => {
      console.error(`[TIKTOK] ❌ Falha ao conectar @${user}:`, err.message);
      activeTiktokConnections.delete(user);
    });

  tiktok.on('gift', data => {
    const totalCoins = (data.diamondCount || 1) * (data.repeatCount || 1);
    broadcast(user, {
      type:        'gift',
      username:    data.uniqueId,
      nickname:    data.nickname || data.uniqueId,
      profilePic:  data.profilePictureUrl,
      giftName:    data.giftName,
      giftId:      data.giftId,
      coins:       data.diamondCount || 1,
      repeatCount: data.repeatCount  || 1,
      totalCoins,
    });
  });

  tiktok.on('like', data => {
    broadcast(user, {
      type:      'like',
      username:  data.uniqueId,
      nickname:  data.nickname || data.uniqueId,
      likeCount: data.likeCount,
    });
  });

  tiktok.on('chat', data => {
    broadcast(user, {
      type:     'chat',
      username: data.uniqueId,
      nickname: data.nickname || data.uniqueId,
      comment:  data.comment,
    });
  });

  tiktok.on('follow', data => {
    broadcast(user, {
      type:     'follow',
      username: data.uniqueId,
      nickname: data.nickname || data.uniqueId,
    });
  });

  tiktok.on('disconnected', () => {
    console.warn(`[TIKTOK] ⚠️  @${user} desconectou da live.`);
    activeTiktokConnections.delete(user);
  });
  
  tiktok.on('error', err => {
    console.error(`[TIKTOK] ❌ Erro em @${user}:`, err);
  });
}

// ─── MODO DEMO ─────────────────────────────────────────────────────────
let demoInterval = null;
function startDemoMode() {
  if (demoInterval) return;
  console.log('🎭 [DEMO] Motor de demonstração ativado.');
  
  const DEMO_NAMES = [
    'pedro_gamer', 'maria_linda', 'joao123', 'tiktoker_br', 'gostosinha_tv',
    'xXsilvaXx', 'lucinha_fan', 'br_toplive', 'caio_do_tiktok', 'ana_presentes'
  ];
  const DEMO_GIFTS = [
    { name: 'Rosa',        coins: 1    },
    { name: 'TikTok',      coins: 1    },
    { name: 'Panda',       coins: 5    },
    { name: 'Love Bang',   coins: 25   },
    { name: 'Incrível',    coins: 100  },
    { name: 'Drama Queen', coins: 5000 },
    { name: 'Lion',        coins: 29999},
    { name: 'Universe',    coins: 34999},
  ];

  demoInterval = setInterval(() => {
    if (!activeClients.has('demo') || activeClients.get('demo').size === 0) return;

    const name = DEMO_NAMES[Math.floor(Math.random() * DEMO_NAMES.length)];
    const weights = [30, 25, 20, 12, 7, 4, 1.5, 0.5];
    let r = Math.random() * weights.reduce((a,b)=>a+b,0), idx = 0;
    for (let w of weights) { if ((r -= w) <= 0) break; idx++; }
    const gift = DEMO_GIFTS[Math.min(idx, DEMO_GIFTS.length - 1)];
    const repeat = Math.random() < 0.3 ? Math.floor(Math.random()*5)+2 : 1;

    broadcast('demo', {
      type:        'gift',
      username:    name,
      nickname:    name,
      profilePic:  `https://api.dicebear.com/7.x/avataaars/png?seed=${name}`,
      giftName:    gift.name,
      coins:       gift.coins,
      repeatCount: repeat,
      totalCoins:  gift.coins * repeat,
    });
  }, 1800);
}

// ─── HTTP SERVER ───────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n🚀 Plataforma SaaS rodando!`);
  console.log(`   Porta Unificada: ${PORT}`);
  console.log(`   Acesse: http://localhost:${PORT}\n`);
});
