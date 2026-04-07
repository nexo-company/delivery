# Colocar o MVP online (apresentação ao cliente)

O Socket.IO precisa ficar no **mesmo servidor sempre ligado** que a API REST. Por isso a API não roda bem em “serverless puro”; os frontends (Next.js) sim — no **Vercel**.

---

## Opção 1 — Mais rápida: túnel (notebook como servidor)

Para uma demo **hoje**, sem publicar em cloud:

1. Deixe rodando localmente: `npm run dev` (API 4000, web 3000, painel 3001).
2. Instale [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/) ou [ngrok](https://ngrok.com/).
3. Abra **3 túneis** (um para cada porta) **ou** use um proxy local que encaminhe rotas (mais trabalhoso).

**Limitação:** o PC precisa ficar ligado e a URL do túnel muda (no plano gratuito do ngrok).

---

## Opção 2 — Recomendada para apresentação: API na Railway + sites no Vercel

### Visão

| O quê | Onde | Por quê |
|--------|------|--------|
| `apps/api` | Railway (ou Render/Fly) | Processo contínuo + WebSocket |
| `apps/web` | Vercel | Next.js |
| `apps/painel` | Vercel (segundo projeto) | Next.js |

### 1) Banco (SQLite com volume **ou** Postgres)

**A — SQLite na Railway (simples para demo)**

1. Crie um projeto na [Railway](https://railway.app/) a partir do seu repositório Git.
2. Adicione um serviço com **Dockerfile** (root do serviço = `apps/api`) ou **Nixpacks** apontando para `apps/api`.
3. Em **Volumes**, monte um disco (ex.: mount path `/data`).
4. Variável de ambiente:
   - `DATABASE_URL` = `file:/data/dev.db`
5. `PORT` normalmente é definido pela Railway (`PORT`); o código já usa `process.env.PORT`.

**Depois do primeiro deploy**, rode o seed **uma vez** (CLI Railway ou “Run command”):

```bash
npx prisma db seed
```

**B — Postgres (Neon/Supabase)** — melhor para produção depois da demo: crie um banco gratuito, defina `DATABASE_URL` com a URL Postgres e altere o `provider` no `schema.prisma` para `postgresql`, depois rode migrações (`prisma migrate`). Para só apresentar, a opção A costuma bastar.

### 2) CORS e URL pública da API

Na Railway, defina (ajuste com as URLs reais do Vercel):

```env
CORS_ORIGIN=https://seu-site.vercel.app,https://seu-painel.vercel.app
```

Sem isso, o navegador bloqueia chamadas do site/painel para a API.

Anote a URL pública da API, por exemplo: `https://sua-api.up.railway.app`.

### 3) Site (`apps/web`) no Vercel

1. [Vercel](https://vercel.com/) → New Project → importe o **mesmo** repositório.
2. **Root Directory:** `apps/web`
3. **Install Command:** `cd ../.. && npm ci`
4. **Build Command:** `npm run build` (padrão, com install na raiz o workspace resolve)
5. **Environment Variables:**
   - `NEXT_PUBLIC_API_URL` = `https://sua-api.up.railway.app` (sem barra no final)

### 4) Painel (`apps/painel`) no Vercel

Repita com um **segundo projeto**:

- **Root Directory:** `apps/painel`
- **Install Command:** `cd ../.. && npm ci`
- **Build Command:** `npm run build`
- **Environment Variables:**
  - `NEXT_PUBLIC_API_URL` = mesma URL da API

### 5) Socket.IO (painel em tempo real)

O painel conecta em `NEXT_PUBLIC_API_URL`. A Railway precisa expor **HTTPS** na mesma origem que o cliente usa; o cliente Socket.IO fará upgrade para WebSocket. Se algo falhar, o cliente já tenta **polling** como fallback.

Se a Railway usar proxy, em casos raros é preciso `trust proxy` no Express — só se notar desconexões estranhas.

### 6) Checklist antes da demo

- [ ] `GET https://sua-api.up.railway.app/health` retorna `{"ok":true}`
- [ ] Cardápio carrega no site (sem erro de CORS)
- [ ] Painel abre e mostra “Tempo real conectado”
- [ ] Fazer um pedido no site e ver no painel + som

---

## Opção 3 — Um único servidor (VPS)

Docker Compose com três serviços (api, web, painel) ou API + Nginx servindo estáticos dos builds Next — mais controle, mais trabalho de manutenção.

---

## Arquivos úteis neste repo

- `apps/api/Dockerfile` — imagem da API (Prisma + `db push` na subida).
- `apps/api/.env.example` — lembrete de `CORS_ORIGIN` e `DATABASE_URL`.

Para dúvidas de domínio próprio (ex.: `pedidos.cliente.com`), configure DNS apontando para Vercel/Railway conforme o painel de cada um.
