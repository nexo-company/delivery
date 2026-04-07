# Colocar o MVP online (apresentação ao cliente)

O Socket.IO precisa ficar no **mesmo processo sempre ligado** que a API REST. Você pode hospedar **tudo na Railway** (três serviços no mesmo projeto) **ou** API na Railway + Next no Vercel.

---

## Opção recomendada: tudo na Railway (API + site + painel)

Um **projeto** na [Railway](https://railway.app/) com **3 serviços**, todos apontando para o **mesmo repositório Git**.

| Serviço | Raiz do repo | Build | Start | Observação |
|---------|----------------|-------|-------|------------|
| **api** | `apps/api` | (Dockerfile ou Nixpacks) | já definido na imagem / `node dist/index.js` | Volume + SQLite ou Postgres |
| **web** | `.` (raiz) | `npm ci && npm run build -w web` | `npm run start -w web` | Usa `PORT` da Railway |
| **painel** | `.` (raiz) | `npm ci && npm run build -w painel` | `npm run start -w painel` | Idem |

### Passos resumidos

1. **Projeto** → *New Project* → *Deploy from GitHub repo* → escolha `nexo-company/delivery` (ou o seu).
2. **Serviço 1 — API**  
   - *Settings* → **Root Directory** = `apps/api`.  
   - Deploy com **Dockerfile** (já existe em `apps/api/Dockerfile`) ou Nixpacks.  
   - **Volume**: mount path `/data`, variável `DATABASE_URL=file:/data/dev.db`.  
   - Depois do primeiro deploy, rode **uma vez**: `npx prisma db seed` (aba *Deployments* → *Run command* ou CLI).
3. **Serviço 2 — Web**  
   - *Add service* → *GitHub repo* (mesmo repo).  
   - **Root Directory** = `.` (vazio / raiz do monorepo).  
   - **Build Command**: `npm ci && npm run build -w web`  
   - **Start Command**: `npm run start -w web`  
   - **Variables**: `NEXT_PUBLIC_API_URL` = URL **https** pública da API (ex.: `https://api-production-xxxx.up.railway.app`), **sem** barra no final.  
   - O `next start` já usa a variável `PORT` que a Railway define.  
   - **Obrigatório:** sem isso o site tenta `http://localhost:4000` no **navegador do cliente** e o cardápio não carrega. Depois de criar/alterar a variável, faça **Redeploy** do serviço web (o Next grava `NEXT_PUBLIC_*` no build).
4. **Serviço 3 — Painel**  
   - Igual ao web, com:  
   - **Build**: `npm ci && npm run build -w painel`  
   - **Start**: `npm run start -w painel`  
   - **Variables**: mesmo `NEXT_PUBLIC_API_URL` da API.
5. **CORS na API**  
   - Variável `CORS_ORIGIN` com as URLs **https** dos dois frontends na Railway, separadas por vírgula, por exemplo:  
   - `https://web-production-xxxx.up.railway.app,https://painel-production-xxxx.up.railway.app`  
   - Depois de alterar CORS, faça **redeploy** da API.

**Dica:** faça o deploy da **API primeiro**, copie a URL pública, configure `NEXT_PUBLIC_API_URL` nos builds do **web** e **painel**, e por último ajuste `CORS_ORIGIN` na API e redeploy.

Na Railway dá para referenciar variáveis de outro serviço (ex.: domínio público); se usar isso, confira na documentação atual da Railway porque o `NEXT_PUBLIC_*` é embutido no **build** do Next — o valor precisa existir no momento do build.

### Por que três serviços?

Cada app é um processo Node separado (porta definida pela Railway). É o modelo natural da plataforma; continua “tudo na Railway”, só não é um único container com os três juntos (o que também seria possível com Docker Compose em um VPS, mas não é o padrão da Railway).

---

## Opção — Túnel (notebook como servidor)

Para uma demo **hoje**, sem publicar em cloud:

1. Deixe rodando localmente: `npm run dev` (API 4000, web 3000, painel 3001).
2. Instale [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/) ou [ngrok](https://ngrok.com/).
3. Abra **3 túneis** (um para cada porta) **ou** use um proxy local que encaminhe rotas (mais trabalhoso).

**Limitação:** o PC precisa ficar ligado e a URL do túnel muda (no plano gratuito do ngrok).

---

## Opção — API na Railway + sites no Vercel

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
