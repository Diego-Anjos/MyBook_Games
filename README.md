# My Book Games

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

## Visão do Produto

**My Book Games** é um catálogo e diário pessoal de gameplay — um lugar para registrar jogos, acompanhar progresso e guardar memórias de sessão com a sensação de folhear um caderno de verdade.

A interface é pensada como um livro antigo imersivo: páginas que viram, tipografia e layout táteis, e uma experiência de navegação centrada no gesto de leitura. O efeito de virar páginas é feito com [`react-pageflip`](https://www.npmjs.com/package/react-pageflip), reforçando a metáfora do diário físico no browser.

## 🚧 Status de Desenvolvimento

A fase atual está **100% focada no Front-End e na UX tátil**: composição das páginas, animações, fluxo visual da biblioteca e conforto de uso no desktop e no mobile.

Os dados exibidos hoje são **mockados**. A integração real com **Supabase** (auth e persistência) e **IGDB** (busca/metadados de jogos) já existe na base de código — clientes, rotas e schema — mas está **adiada temporariamente** até a experiência de interface amadurecer.

Para explorar a app sem backend, basta rodar o projeto sem preencher as variáveis de ambiente: a home cai no modo biblioteca com dados de demonstração.

## Instalação e Execução

### Pré-requisitos

- [Node.js](https://nodejs.org/) (recomendado: LTS)
- npm (vem com o Node)

### Passos

1. **Clone o repositório**

```bash
git clone <url-do-repositorio>
cd MyBookGames
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure o ambiente (opcional para o modo mock)**

```bash
cp .env.example .env.local
```

Para rodar com dados mockados, **não é necessário preencher as chaves** no `.env.local`. Deixe o arquivo vazio ou com os placeholders do exemplo — a aplicação funciona sem Supabase/IGDB configurados.

Quando for ativar a integração real, preencha:

- `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `TWITCH_CLIENT_ID` e `TWITCH_CLIENT_SECRET` (API da IGDB via Twitch)

4. **Suba o servidor de desenvolvimento**

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.
