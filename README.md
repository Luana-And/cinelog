# CineLog — Backend C# + Frontend Vite

Sistema para avaliar (com estrelinhas ★), adicionar e remover filmes/séries,
com análise opcional via IA (Claude).

```
cinelog/
├── backend/CineLog.Api/    → API REST em C# (.NET 8 + EF Core + SQLite)
└── frontend/                → App em Vite + JavaScript puro
```

---

## 1. Pré-requisitos

| Ferramenta | Onde baixar |
|---|---|
| **.NET 8 SDK** | https://dotnet.microsoft.com/download/dotnet/8.0 |
| **Node.js 18+** | https://nodejs.org |

Verifique se estão instalados:
```bash
dotnet --version    # deve mostrar 8.x
node --version      # deve mostrar v18+ 
```

---

## 2. Rodar o Backend (C#)

```bash
cd backend/CineLog.Api
dotnet restore
dotnet run
```

A API sobe em **http://localhost:5189**.
O banco SQLite (`cinelog.db`) é criado automaticamente na primeira execução — não precisa rodar migrations manualmente.

### (Opcional) Configurar a IA
O botão **✦ IA** em cada filme chama o Claude através do backend. Para ativá-lo,
edite `backend/CineLog.Api/appsettings.json` e coloque sua chave:

```json
"ANTHROPIC_API_KEY": "sk-ant-..."
```

Sem a chave, todo o resto do app funciona normalmente — só o botão de IA vai dar erro.

### Endpoints disponíveis
| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/media` | Lista todos (aceita `?type=filme` e `?q=busca`) |
| POST | `/api/media` | Cria `{ title, type }` |
| PATCH | `/api/media/{id}` | Atualiza `{ rating, notes }` |
| DELETE | `/api/media/{id}` | Remove |
| POST | `/api/media/{id}/analyze` | Gera análise via IA |
| GET | `/api/media/stats` | Estatísticas (total, filmes, séries, média) |

---

## 3. Rodar o Frontend (Vite)

Em **outro terminal**, sem fechar o backend:

```bash
cd frontend
npm install
npm run dev
```

Abre automaticamente em **http://localhost:5173**.

> ⚠️ O frontend espera o backend em `http://localhost:5189`.
> Se você mudar a porta do backend, atualize a constante `BASE_URL`
> em `frontend/src/api/mediaApi.js`.

---

## 4. Ordem de execução

1. Terminal 1 → `dotnet run` (dentro de `backend/CineLog.Api`)
2. Terminal 2 → `npm run dev` (dentro de `frontend`)
3. Acesse `http://localhost:5173` no navegador

---

## 5. Resolução de problemas

**"Could not read package.json"**
→ Você rodou `npm run dev` fora da pasta `frontend`. Entre na pasta correta primeiro.

**Frontend mostra "Não foi possível conectar ao backend"**
→ O backend C# não está rodando, ou está em outra porta. Confirme com `dotnet run` no terminal do backend.

**Erro de CORS no console do navegador**
→ Confirme que o backend está rodando exatamente em `http://localhost:5189` (a política de CORS no `Program.cs` libera apenas `http://localhost:5173`).

**Botão ✦ IA retorna erro**
→ Verifique se `ANTHROPIC_API_KEY` foi configurada em `appsettings.json`.
