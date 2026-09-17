# Inphantil Cloud

Painel interno + mostruário da Inphantil. Monólito **Next.js 16 (App Router)**
com duas áreas:

- **Pública** (sem login): landing e **mostruário** (vitrine, sem venda).
- **Fechada** (login obrigatório): ferramentas internas, catálogo, admin.

> **Ciclo 1 (esta entrega):** base + autenticação + upload de imagem + tema/
> animações. As funcionalidades de negócio (protetor de parede, tapete,
> orçamentos, frete, calculadoras, catálogo, mostruário) estão como
> _placeholders_ "Em breve", com a proteção de rota já correta.

## Stack

Next.js 16 · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui (Radix) ·
Framer Motion · Prisma + PostgreSQL (Neon) · Auth.js (NextAuth v5, JWT) ·
React Hook Form + Zod · Cloudinary · next-themes.

## Papéis (RBAC)

Poder: **DEV > ADMIN > SELLER**.

| Papel  | Acesso |
| ------ | ------ |
| SELLER | Ferramentas internas (calculadoras, protetor, tapete, orçamentos, frete). |
| ADMIN  | Tudo da área fechada, **menos** gerenciar usuários (+ catálogo, teste de upload). |
| DEV    | Tudo, **incluindo** criar/editar/ativar/desativar usuários. |

A guarda `requireRole()` (`src/lib/rbac.ts`) roda no servidor (Server Actions,
Route Handlers e páginas). O `middleware.ts` separa rotas públicas das fechadas.
**Nunca** confie apenas no front.

## Pré-requisitos

- Node 20+ (testado no 24)
- Um banco PostgreSQL (recomendado: [Neon](https://neon.tech))
- Uma conta [Cloudinary](https://cloudinary.com) (free tier)

## Como rodar

```bash
# 1) Instalar dependências
npm install

# 2) Configurar ambiente
cp .env.example .env
#   Preencha DATABASE_URL, NEXTAUTH_SECRET (npx auth secret),
#   SEED_DEV_* e as credenciais do Cloudinary.

# 3) Criar as tabelas (a migration inicial já vem incluída em prisma/migrations)
npm run prisma:migrate       # aplica a migration no banco (dev)
#   (em produção/CI use: npx prisma migrate deploy)

# 4) Semear o DEV inicial (usa SEED_DEV_EMAIL / SEED_DEV_PASSWORD)
npm run db:seed

# 5) Subir em desenvolvimento
npm run dev                  # http://localhost:3000
```

Login inicial: o e-mail/senha definidos em `SEED_DEV_EMAIL` / `SEED_DEV_PASSWORD`.
Novos usuários são criados **apenas pelo DEV** em `/admin/usuarios` (não há
auto-cadastro).

## Scripts

| Script | O que faz |
| ------ | --------- |
| `npm run dev` | Desenvolvimento |
| `npm run build` / `start` | Build e produção |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run prisma:migrate` | Migration de desenvolvimento |
| `npm run db:seed` | Semeia o DEV inicial |
| `npm run prisma:studio` | Prisma Studio |

## Upload de imagens (Cloudinary) e ciclo de vida

Todo upload/substituição/exclusão passa pelo serviço central
`src/lib/cloudinary.ts`, para **nunca** deixar arquivo órfão:

- **Upload:** o cliente pede uma **assinatura** (Server Action
  `createUploadSignature`), envia o arquivo direto ao Cloudinary e o servidor
  grava apenas `url` + `publicId`.
- **Substituir:** envia a nova → atualiza o banco → **só então** destrói a
  antiga. Se o banco falhar, a nova é removida e a antiga permanece.
- **Excluir:** remove o registro e depois destrói o(s) `publicId`(s).
- **Rede de segurança:** se um `destroy` falhar, o `publicId` vai para a tabela
  `OrphanImage` e a rotina `/api/cron/cleanup-images` (Vercel Cron diário,
  protegida por `CRON_SECRET`) tenta de novo **e** varre a pasta do Cloudinary
  removendo o que não tem mais referência no banco.

Página protegida para comprovar tudo: **`/admin/upload-teste`**
(enviar → substituir → excluir).

## Estrutura

```
src/
  app/
    (public)/            # ABERTO: landing (/) e /mostruario
    (auth)/login/        # login
    (app)/               # FECHADO: shell com sidebar + topbar
      dashboard/
      calculadoras/  protetor-parede/  tapete/
      orcamentos/    frete/            catalogo/     # placeholders
      admin/usuarios/       # SÓ DEV — CRUD de usuários
      admin/upload-teste/   # teste do ciclo de upload
    api/auth/[...nextauth]/
    api/cron/cleanup-images/
  components/  (ui/ = shadcn, app-shell/, upload/, motion/, ...)
  lib/  (auth, prisma, rbac, roles, cloudinary, media-cleanup, nav, validators)
prisma/  (schema.prisma, seed.ts)
```

## Deploy (Vercel)

- Sem segredos no código — tudo por variáveis de ambiente (as mesmas do
  `.env.example`). Defina também `NEXTAUTH_URL` e `CRON_SECRET`.
- `vercel.json` já agenda a limpeza de imagens (cron diário às 04:00 UTC).
- Migrations em produção: `npx prisma migrate deploy`.

## Notas

- `next.config.ts` libera `res.cloudinary.com` para o `next/image`.
- Auditoria: há um aviso de vulnerabilidade em `deepmerge-ts`, dependência
  **transitiva de lint** (dev-only), sem impacto em runtime.
