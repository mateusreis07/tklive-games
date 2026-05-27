# ⚔️ Arena do Caos — TikTok Live Game

Jogo interativo para TikTok Live onde presentes viram guerreiros que batalham em tempo real na tela!

---

## 🎮 Como Funciona

- Espectadores enviam **presentes** na sua live TikTok
- Cada presente **spawna um guerreiro** na arena com poder proporcional ao valor
- Os guerreiros se combatem automaticamente em tempo real
- Leaderboard ao vivo mostra os top presenteiros

### Tiers de Guerreiro

| Tier | Moedas | Forma | Cor |
|------|--------|-------|-----|
| 1 ⚔️ | 1–9 | Círculo | Colorido |
| 2 💎 | 10–49 | Hexágono | Ciano/Azul |
| 3 👑 | 50–999 | Diamante | Dourado |
| 4 🦁 | 1000+ | Estrela 8pts | Magenta/Branco |

---

## 🚀 Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Rodar em modo DEMO (sem live real, presentes simulados)
npm run dev

# 3. Rodar com sua live TikTok real
TIKTOK_USER=seu_usuario_aqui npm start
```

Depois abra: **http://localhost:3000**

---

## 📁 Estrutura

```
arena-do-caos/
├── server.js        # Servidor Node.js + TikTok Live Connector + WebSocket
├── package.json
└── public/
    └── index.html   # Jogo completo (canvas + UI overlay)
```

---

## ⚙️ Configuração

### Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `TIKTOK_USER` | Seu @usuario do TikTok (sem o @) |

### Se precisar de autenticação (live privada ou com restrições)

No `server.js`, descomente e preencha:
```js
sessionId: 'SEU_SESSION_ID_DO_COOKIE',
```
O `sessionId` fica no cookie `sessionid` quando você está logado no TikTok no browser.

---

## 🎯 Recursos

- ✅ Arena circular com grade e efeitos de luz
- ✅ 4 tiers de guerreiros com formas e cores distintas
- ✅ Sistema de combate com dano, HP e morte
- ✅ Partículas e efeitos de explosão
- ✅ Screen shake e flash por tier
- ✅ Mega evento para presentes tier 4 (Lion, Universe etc.)
- ✅ Sistema de combos por usuário
- ✅ Leaderboard top 7 ao vivo
- ✅ Feed de chat scrollando no rodapé
- ✅ Notificações animadas por tier
- ✅ Modo DEMO para testar sem live
- ✅ Reconexão automática do WebSocket
