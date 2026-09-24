export type Game = {
  id: string;
  title: string;
  coverUrl: string;
  startedAt: string;
  startTime: string;
  completedAt: string | null;
  endTime: string | null;
  playtimeHours: number;
  year: number;
  zerado: boolean;
  description: string;
  developer: string;
  platform: string;
  genre: string;
  /** Nota pessoal de 0 a 10. */
  rating: number;
};

/** Mockups temporários da biblioteca (1 jogo por página). */
export const MOCK_GAMES: Game[] = [
  {
    id: "1",
    title: "The Legend of Zelda: Tears of the Kingdom",
    coverUrl: "https://picsum.photos/seed/zelda-totk/400",
    startedAt: "12 Mar 2024",
    startTime: "21:30",
    completedAt: "02 Ago 2024",
    endTime: "23:15",
    playtimeHours: 86,
    year: 2024,
    zerado: true,
    description:
      "Hyrule nunca pareceu tão vasta. Cada torre, cada caverna, cada ideia absurda de construção virou uma pequena história. Demorei meses, mas cada sessão valeu o diário.",
    developer: "Nintendo EPD",
    platform: "Nintendo Switch",
    genre: "Ação / Aventura",
    rating: 9.5,
  },
  {
    id: "2",
    title: "Baldur's Gate 3",
    coverUrl: "https://picsum.photos/seed/bg3/400",
    startedAt: "18 Jan 2024",
    startTime: "20:00",
    completedAt: "22 Jun 2024",
    endTime: "01:40",
    playtimeHours: 120,
    year: 2024,
    zerado: true,
    description:
      "Um RPG que exige decisões de verdade. Perdi noites com diálogos, combates e traições — e ainda sinto falta do campfire com a party.",
    developer: "Larian Studios",
    platform: "PC",
    genre: "RPG",
    rating: 10,
  },
  {
    id: "3",
    title: "Elden Ring",
    coverUrl: "https://picsum.photos/seed/elden/400",
    startedAt: "05 Fev 2023",
    startTime: "19:45",
    completedAt: "14 Mai 2023",
    endTime: "22:10",
    playtimeHours: 95,
    year: 2023,
    zerado: true,
    description:
      "A Lands Between me engoliu. Chefes injustos, paisagens impossíveis e aquela sensação de descobrir um segredo atrás de outro. Brutal e belíssimo.",
    developer: "FromSoftware",
    platform: "PlayStation 5",
    genre: "Action RPG",
    rating: 9.5,
  },
  {
    id: "4",
    title: "Hollow Knight: Silksong",
    coverUrl: "https://picsum.photos/seed/silksong/400",
    startedAt: "10 Jan 2026",
    startTime: "22:00",
    completedAt: null,
    endTime: null,
    playtimeHours: 42,
    year: 2026,
    zerado: false,
    description:
      "Hornet é rápida, exigente e viciante. Ainda a meio do mapa — e já sei que este diário vai ganhar muitas páginas.",
    developer: "Team Cherry",
    platform: "PC",
    genre: "Metroidvania",
    rating: 9,
  },
  {
    id: "5",
    title: "Hades II",
    coverUrl: "https://picsum.photos/seed/hades2/400",
    startedAt: "03 Mar 2026",
    startTime: "21:15",
    completedAt: "28 Abr 2026",
    endTime: "00:30",
    playtimeHours: 38,
    year: 2026,
    zerado: true,
    description:
      "Mais uma run, mais uma história. Melinoë carrega o legado do primeiro Hades com força própria — combate afiado e narrativa que prende.",
    developer: "Supergiant Games",
    platform: "PC",
    genre: "Roguelike",
    rating: 9,
  },
  {
    id: "6",
    title: "Red Dead Redemption 2",
    coverUrl: "https://picsum.photos/seed/rdr2/400",
    startedAt: "20 Set 2023",
    startTime: "18:30",
    completedAt: "11 Dez 2023",
    endTime: "23:50",
    playtimeHours: 72,
    year: 2023,
    zerado: true,
    description:
      "Arthur Morgan merecia cada hora. O Oeste lento, cru e cinematográfico — um romance de cowboys com o peso de um romance literário.",
    developer: "Rockstar Games",
    platform: "PlayStation 4",
    genre: "Ação / Aventura",
    rating: 9.5,
  },
  {
    id: "7",
    title: "Celeste",
    coverUrl: "https://picsum.photos/seed/celeste/400",
    startedAt: "01 Abr 2024",
    startTime: "16:00",
    completedAt: null,
    endTime: null,
    playtimeHours: 18,
    year: 2024,
    zerado: false,
    description:
      "A montanha e eu. Cada morte é um passo; cada pico, uma pequena vitória. Ainda a subir — e a respirar junto com Madeline.",
    developer: "Maddy Makes Games",
    platform: "Nintendo Switch",
    genre: "Plataforma",
    rating: 9,
  },
  {
    id: "8",
    title: "Disco Elysium",
    coverUrl: "https://picsum.photos/seed/disco/400",
    startedAt: "15 Nov 2023",
    startTime: "20:45",
    completedAt: "09 Jan 2024",
    endTime: "02:20",
    playtimeHours: 34,
    year: 2023,
    zerado: true,
    description:
      "Um romance policial escrito em skill checks. Revachol ficou na cabeça semanas depois do ending — literatura interativa no seu melhor.",
    developer: "ZA/UM",
    platform: "PC",
    genre: "RPG / Narrativo",
    rating: 10,
  },
  {
    id: "9",
    title: "Outer Wilds",
    coverUrl: "https://picsum.photos/seed/outerwilds/400",
    startedAt: "08 Mai 2024",
    startTime: "19:00",
    completedAt: "19 Mai 2024",
    endTime: "21:05",
    playtimeHours: 28,
    year: 2024,
    zerado: true,
    description:
      "Vinte e dois minutos que mudaram a forma como penso em mistérios. Nunca mais vou ouvir um violino sem lembrar do sol a morrer.",
    developer: "Mobius Digital",
    platform: "PC",
    genre: "Exploração",
    rating: 10,
  },
  {
    id: "10",
    title: "Persona 5 Royal",
    coverUrl: "https://picsum.photos/seed/p5r/400",
    startedAt: "02 Fev 2023",
    startTime: "17:30",
    completedAt: "30 Abr 2023",
    endTime: "23:00",
    playtimeHours: 110,
    year: 2023,
    zerado: true,
    description:
      "Estilo, jazz e amizades. Tokyo virou rotina — e a Phantom Thieves, família. Um ano escolar que passou rápido demais.",
    developer: "Atlus",
    platform: "PlayStation 5",
    genre: "JRPG",
    rating: 9.5,
  },
  {
    id: "11",
    title: "Clair Obscur: Expedition 33",
    coverUrl: "https://picsum.photos/seed/expedition33/400",
    startedAt: "14 Fev 2026",
    startTime: "21:00",
    completedAt: null,
    endTime: null,
    playtimeHours: 55,
    year: 2026,
    zerado: false,
    description:
      "Pintura, melancolia e turn-based com alma. Ainda a meio da expedição — cada ato parece um capítulo de um romance francês.",
    developer: "Sandfall Interactive",
    platform: "PC",
    genre: "JRPG",
    rating: 9,
  },
  {
    id: "12",
    title: "Metroid Prime Remastered",
    coverUrl: "https://picsum.photos/seed/metroid/400",
    startedAt: "21 Jun 2024",
    startTime: "15:20",
    completedAt: "03 Jul 2024",
    endTime: "18:45",
    playtimeHours: 16,
    year: 2024,
    zerado: true,
    description:
      "Tallon IV ainda hipnotiza. Atmosfera, scans e solidão espacial — o remaster respeita o clássico sem perder o mistério.",
    developer: "Retro Studios",
    platform: "Nintendo Switch",
    genre: "Ação / Aventura",
    rating: 9,
  },
  {
    id: "13",
    title: "Sekiro: Shadows Die Twice",
    coverUrl: "https://picsum.photos/seed/sekiro/400",
    startedAt: "11 Ago 2023",
    startTime: "22:30",
    completedAt: "29 Set 2023",
    endTime: "01:10",
    playtimeHours: 48,
    year: 2023,
    zerado: true,
    description:
      "Deflect. Deflect. Deflect. Quando o ritmo encaixou, Isshin caiu — e eu nunca mais olhei para um combate da mesma forma.",
    developer: "FromSoftware",
    platform: "PC",
    genre: "Ação",
    rating: 9.5,
  },
  {
    id: "14",
    title: "Stardew Valley",
    coverUrl: "https://picsum.photos/seed/stardew/400",
    startedAt: "01 Jan 2026",
    startTime: "14:00",
    completedAt: null,
    endTime: null,
    playtimeHours: 64,
    year: 2026,
    zerado: false,
    description:
      "A quinta nunca acaba. Plantar, pescar, conversar — um diário de calma entre os jogos mais intensos da estante.",
    developer: "ConcernedApe",
    platform: "PC",
    genre: "Simulação",
    rating: 8.5,
  },
  {
    id: "15",
    title: "Ghost of Tsushima",
    coverUrl: "https://picsum.photos/seed/got/400",
    startedAt: "17 Out 2024",
    startTime: "20:15",
    completedAt: "09 Nov 2024",
    endTime: "22:40",
    playtimeHours: 52,
    year: 2024,
    zerado: true,
    description:
      "Jin Sakai entre a honra e a sombra. Folhas a cair, duelos no vento — um filme de samurai que se joga.",
    developer: "Sucker Punch",
    platform: "PlayStation 5",
    genre: "Ação / Aventura",
    rating: 9,
  },
  {
    id: "16",
    title: "The Witcher 3",
    coverUrl: "https://picsum.photos/seed/witcher3/400",
    startedAt: "03 Mar 2023",
    startTime: "19:00",
    completedAt: "28 Jul 2023",
    endTime: "00:55",
    playtimeHours: 140,
    year: 2023,
    zerado: true,
    description:
      "Geralt, Ciri e o Continente. Side quests que mereciam ser romances próprios. Terminei exausto e feliz — e com saudades de Velen.",
    developer: "CD Projekt Red",
    platform: "PC",
    genre: "Action RPG",
    rating: 10,
  },
];

/** Ano de fundação do diário — início do filtro de anos. */
const DIARY_FOUNDING_YEAR = 2026;

/** Anos do cabeçalho: da fundação até o ano atual do sistema. */
export const LIBRARY_YEARS: readonly number[] = (() => {
  const startYear = DIARY_FOUNDING_YEAR;
  const currentYear = new Date().getFullYear();
  const endYear = Math.max(startYear, currentYear);
  return Array.from(
    { length: endYear - startYear + 1 },
    (_, i) => startYear + i,
  );
})();
