<div align="center">

# 📖 My Book Games

### *A Crônica das Jornadas*

**O seu refúgio pessoal para registrar as memórias das suas maiores jornadas nos videogames.**

*Não é um simples tracker. É um diário imersivo — um tomo ancestral onde cada jogo é uma página e cada platina é um capítulo encerrado.*

---

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript_5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)

</div>

---

## 📜 Sobre o Projeto — *O Livro*

> *"Todo jogador carrega dentro de si uma biblioteca esquecida — horas que viraram histórias, histórias que viraram memórias, memórias que ninguém jamais registrou."*

**My Book Games** é uma aplicação web full-stack que transforma a sua coleção de videogames em um **diário interativo com a estética de um livro mágico**. Inspirado na linguagem visual de tomos medievais e grimórios de fantasia, o projeto usa fontes serifadas (*Playfair Display* e *Lora*), paleta em dourado envelhecido e azul marinho profundo, e uma animação real de virada de páginas para criar uma experiência que vai muito além de uma planilha ou lista de games.

O diferencial não está apenas no design — está na **filosofia**: cada jogo que você zerou merece ser lembrado como uma conquista literária. O sistema é construído com **autenticação e isolamento de dados de ponta a ponta** via Supabase RLS, garantindo que o livro de cada escritor seja verdadeiramente seu.

---

## ✨ Funcionalidades Principais — *As Páginas*

### 📚 Catálogo Pessoal com Busca Integrada
- Adicione, edite e organize seus jogos em um **livro com animação de virada de página** (`react-pageflip`).
- A busca de jogos é integrada à **API da IGDB** (via Twitch), trazendo automaticamente **capa, desenvolvedor, distribuidora, gêneros, sinopse e data de lançamento**.
- Registre sua **plataforma**, **tempo de jogo**, **nota pessoal**, **data de início e fim** e a sua própria **narrativa** sobre a experiência.

### 🔮 O Arquivista — IA que Lê a sua Alma de Jogador
- Um **personagem com persona própria**: O Arquivista é um guardião misterioso e sábio do livro, powered by **Google Gemini 3.8-Flash**.
- Ele analisa suas **estatísticas reais** (gêneros favoritos, horas totais, média de notas, plataformas, meses mais ativos) e tece uma **crônica poética e única**, como um bibliotecário de fantasia lendo um pergaminho à luz de velas.
- Cada leitura é diferente — o modelo foi instruído para variar estrutura, ritmo e ponto de partida a cada chamada.

### ⚔️ A Guilda — Sistema Social em Tempo Real
- **Adicione amigos pelo UID** de 8 dígitos exclusivo de cada escritor.
- Visualize a **Ficha do Companheiro** — um modal somente leitura com a foto, nome e capa do perfil do amigo.
- **Leia o Livro do amigo**: acesse todos os jogos que ele já zerou, com nota e tempo de jogo.
- **Chat em tempo real** entre membros da guilda via **Supabase Realtime**, com badge de mensagens não lidas que desaparece instantaneamente ao abrir a conversa.
- Sistema de **notificações de pedido de amizade** com indicador pulsante no menu.

### 🏆 O Ranking — O Top 10 da Sua Lenda
- Monte o seu **ranking pessoal dos 10 melhores jogos** de cada ano.
- Interface drag-and-drop por seleção, com busca inline e posições numeradas.
- Filtro dinâmico por ano, baseado nos jogos realmente catalogados.

### 📊 A Crônica das Jornadas — Retrospectiva Pessoal
- Painel de **estatísticas consolidadas**: total de jogos, finais alcançados, horas de jogo e jornadas em andamento.
- **Linha do tempo cronológica** navegável por ano e mês, com acesso direto ao card do jogo no livro.

### 👤 Ficha do Escritor — Perfil Completo
- Upload de **retrato (avatar)** e **capa de perfil** direto para o Supabase Storage.
- Edição de nome, nickname, plataforma principal e senha.
- **UID de 8 dígitos** copiável para compartilhar com amigos.
- Exclusão total de conta com **modal de confirmação temático** ("Queimar o Livro?") e deleção em cascata via Admin API do Supabase.

### 🔒 Segurança e Autenticação
- **Autenticação completa** com Supabase Auth (e-mail + senha).
- **Row Level Security (RLS)** em todas as tabelas: perfis, jogos, mensagens, amizades e rankings — cada usuário acessa apenas os seus próprios dados.
- Rotas de API protegidas com verificação de sessão por **cookie SSR** e **Bearer token**.

---

## 🛠️ Tecnologias Utilizadas — *A Magia*

### Frontend
| Tecnologia | Versão | Uso |
|---|---|---|
| **Next.js** | 16.3.5 | Framework principal (App Router, Server Components, API Routes) |
| **React** | 19 | Biblioteca de UI |
| **TypeScript** | 5 | Tipagem estática de ponta a ponta |
| **Tailwind CSS** | 4 | Estilização utility-first com design system customizado |
| **Playfair Display + Lora** | — | Tipografia serifada via Google Fonts |
| **react-pageflip** | 2.0.3 | Animação de virada de página do livro |
| **lucide-react** | 1.47.0 | Biblioteca de ícones |
| **recharts** | 3.10.1 | Gráficos e visualizações de dados |

### Backend (Next.js API Routes)
| Rota | Método | Descrição |
|---|---|---|
| `/api/games/search` | `POST` | Busca de jogos na API da IGDB via Twitch OAuth |
| `/api/games` | `GET/POST` | Gerenciamento do catálogo pessoal |
| `/api/oracle` | `POST` | Geração de crónica poética via Google Gemini |
| `/api/account/delete` | `POST` | Exclusão total de conta via Supabase Admin API |

### Banco de Dados e Infraestrutura
| Tecnologia | Uso |
|---|---|
| **Supabase PostgreSQL** | Banco relacional principal (perfis, jogos, mensagens, amizades, rankings, notificações) |
| **Supabase Auth** | Autenticação com sessão SSR via cookies |
| **Supabase Realtime** | Chat e badges de mensagens não lidas em tempo real |
| **Supabase Storage** | Upload de avatares e capas de perfil |
| **Supabase RLS** | Isolamento de dados por usuário em todas as tabelas |

---

## 🚀 Como Executar o Projeto — *Abrindo o Tomo*

### Pré-requisitos

- **Node.js** `v18+` (recomendado: `v20 LTS`)
- **npm**, **yarn** ou **pnpm**
- Uma conta no [Supabase](https://supabase.com) com um projeto criado
- Uma conta na [Twitch Developer Console](https://dev.twitch.tv/console) para acesso à API da IGDB
- Uma chave de API do [Google AI Studio](https://aistudio.google.com) para o Gemini

### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/my-book-games.git
cd my-book-games
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto copiando o exemplo abaixo:

```env
# ── Supabase ────────────────────────────────────────────────────────────────
# Encontre em: Supabase Dashboard → Project Settings → API

NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_publica_aqui

# Necessária APENAS nas rotas de API de servidor (nunca exposta ao client)
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# ── IGDB / Twitch ────────────────────────────────────────────────────────────
# Encontre em: https://dev.twitch.tv/console → Applications

TWITCH_CLIENT_ID=seu_client_id_aqui
TWITCH_CLIENT_SECRET=seu_client_secret_aqui

# ── Google Gemini — O Arquivista ────────────────────────────────────────────
# Encontre em: https://aistudio.google.com/app/apikey

GEMINI_API_KEY=sua_gemini_api_key_aqui
```

> ⚠️ **Importante:** Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` ou `TWITCH_CLIENT_SECRET` no client-side. Estas chaves devem ser usadas **exclusivamente** nas rotas de API do servidor (sem o prefixo `NEXT_PUBLIC_`).

### 4. Configure o banco de dados no Supabase

No painel do Supabase, crie as seguintes tabelas (ou importe o schema SQL):

- `profiles` — dados do escritor (nickname, avatar_url, cover_url, platform, uid)
- `games` — catálogo de jogos (title, cover_url, developer, is_cleared, rating, playtime…)
- `friendships` — relações de amizade (user_id, friend_id, status)
- `messages` — mensagens de chat (sender_id, receiver_id, content, read)
- `notifications` — notificações de sistema (user_id, sender_id, type, is_read)
- `yearly_rankings` — ranking anual (user_id, year, rank_position, game_id)

> Certifique-se de habilitar as **políticas RLS** em todas as tabelas e ativar a **publicação do Realtime** para a tabela `messages`.

### 5. Inicie o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) e abra o Tomo. ✨

---

## 📁 Estrutura do Projeto

```
my-book-games/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── account/delete/route.ts   # Exclusão de conta (Admin API)
│   │   │   ├── games/search/route.ts     # Busca IGDB
│   │   │   ├── games/route.ts            # CRUD de jogos
│   │   │   └── oracle/route.ts           # IA Gemini — O Arquivista
│   │   ├── layout.tsx                    # Layout raiz com fontes e BookLayout
│   │   ├── page.tsx                      # Página principal
│   │   └── globals.css                   # Estilos globais e variáveis CSS
│   ├── components/
│   │   ├── library/
│   │   │   ├── LibraryHeader.tsx         # Menu, badges e modais globais
│   │   │   ├── HTMLBook.tsx              # Livro com animação de página
│   │   │   ├── GameCard.tsx              # Card individual de jogo
│   │   │   ├── MessagesModal.tsx         # Chat em tempo real
│   │   │   ├── FriendsModal.tsx          # Sistema de guilda
│   │   │   ├── FriendProfileModal.tsx    # Ficha somente leitura do amigo
│   │   │   ├── FriendBookModal.tsx       # Catálogo de jogos zerados do amigo
│   │   │   ├── UserProfileModal.tsx      # Ficha do escritor (com edição)
│   │   │   ├── NotificationsModal.tsx    # Central de notificações
│   │   │   ├── RankingModal.tsx          # Top 10 anual
│   │   │   ├── ArchivistModal.tsx        # Interface d'O Arquivista (Gemini)
│   │   │   ├── OracleModal.tsx           # Oráculo das páginas
│   │   │   └── AddGameModal.tsx          # Formulário de novo jogo
│   │   ├── BookLayout.tsx                # Wrapper com background e vinheta
│   │   └── AuthBook.tsx                  # Tela de autenticação
│   ├── lib/
│   │   ├── supabase.ts                   # Client-side Supabase client
│   │   ├── supabase/
│   │   │   ├── client.ts                 # Browser client
│   │   │   └── server.ts                 # SSR client (cookies)
│   │   ├── database.ts                   # Tipos TypeScript das tabelas
│   │   ├── games.ts                      # Mappers e helpers de jogos
│   │   ├── profile.ts                    # Helpers de perfil (UID)
│   │   └── igdb/                         # Integração com a API da IGDB
│   └── data/
│       └── mock-games.ts                 # Tipos do modelo de jogo
├── public/
│   ├── Logo.png
│   └── background.png
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

---

## 🎨 Design System

O projeto usa um **sistema de cores e tipografia** customizado, inspirado em livros antigos e grimórios de fantasia:

| Token | Valor | Uso |
|---|---|---|
| `book-blue` | `#0F1C2E` | Azul marinho profundo — capa do livro, backgrounds |
| `book-blue-light` | `#1A2D45` | Azul claro — cards e surfaces secundários |
| `book-gold` | `#C9A84C` | Dourado envelhecido — títulos, bordas e ornamentos |
| `book-paper` | `#F3E8D4` | Pergaminho — fundos claros, texto sobre escuro |
| `font-display` | Playfair Display | Títulos, labels e ornamentos tipográficos |
| `font-body` | Lora | Corpo de texto, descrições e formulários |

---

## 👤 Autor

<div align="center">

**Diego**

*Escritor do Tomo · Desenvolvedor Full Stack*

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/seu-perfil)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/seu-usuario)

</div>

---

<div align="center">

*"O livro nunca se fecha por completo. Sempre haverá uma nova jornada a registrar."*

**My Book Games** · Feito com ☕, 🎮 e muito ✨

</div>
