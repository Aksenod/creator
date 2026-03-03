export interface TeamMember {
  id: string
  name: string
  role: string
  specialty: string
  location: string
  flag: string
  avatarUrl: string
  status: 'active' | 'busy' | 'offline'
  bio: string
}

export const teamMembers: TeamMember[] = [
  {
    id: 'pm',
    name: 'Александр Волков',
    role: 'Project Manager',
    specialty: 'Координация, оркестрация, deploy',
    location: 'Москва, Россия',
    flag: '\u{1F1F7}\u{1F1FA}',
    avatarUrl: 'https://i.pravatar.cc/150?img=12',
    status: 'active',
    bio: 'Единственная точка контакта с клиентом. Управляет 9-фазным pipeline, приоритизирует задачи, контролирует качество и deploy.',
  },
  {
    id: 'researcher',
    name: 'Мария Ковалёва',
    role: 'Researcher',
    specialty: 'Анализ кодовой базы, паттерны',
    location: 'Санкт-Петербург, Россия',
    flag: '\u{1F1F7}\u{1F1FA}',
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
    status: 'active',
    bio: 'Исследует кодовую базу в начале каждой задачи. Находит переиспользуемые компоненты, существующие паттерны и зависимости.',
  },
  {
    id: 'competitor-analyst',
    name: 'Дмитрий Шульц',
    role: 'Competitor Analyst',
    specialty: 'Figma, Webflow, Framer',
    location: 'Берлин, Германия',
    flag: '\u{1F1E9}\u{1F1EA}',
    avatarUrl: 'https://i.pravatar.cc/150?img=53',
    status: 'busy',
    bio: 'Анализирует UX конкурентов — Figma, Webflow, Framer. Собирает best practices и адаптирует под наш контекст.',
  },
  {
    id: 'architect',
    name: 'Андрей Сергеев',
    role: 'Architect',
    specialty: 'Проектирование, архитектура',
    location: 'Новосибирск, Россия',
    flag: '\u{1F1F7}\u{1F1FA}',
    avatarUrl: 'https://i.pravatar.cc/150?img=60',
    status: 'active',
    bio: 'Проектирует реализацию фич, определяет затрагиваемые файлы, выбирает подход. Создаёт пошаговые планы.',
  },
  {
    id: 'designer',
    name: 'Нино Мерабишвили',
    role: 'Designer',
    specialty: 'UI/UX, мокапы, визуал',
    location: 'Тбилиси, Грузия',
    flag: '\u{1F1EC}\u{1F1EA}',
    avatarUrl: 'https://i.pravatar.cc/150?img=25',
    status: 'active',
    bio: 'Создаёт .pen мокапы для UI-задач. Визуальная валидация через скриншоты перед реализацией.',
  },
  {
    id: 'layout-engineer',
    name: 'Рустам Хакимов',
    role: 'Layout Engineer',
    specialty: 'Grid, Flex, responsive',
    location: 'Казань, Россия',
    flag: '\u{1F1F7}\u{1F1FA}',
    avatarUrl: 'https://i.pravatar.cc/150?img=51',
    status: 'active',
    bio: 'Контролирует layout-first подход. Grid vs Flex решения, responsive стратегия, глубина вложенности.',
  },
  {
    id: 'code-reviewer',
    name: 'Ольга Новак',
    role: 'Code Reviewer',
    specialty: 'Качество, паттерны, DRY',
    location: 'Минск, Беларусь',
    flag: '\u{1F1E7}\u{1F1FE}',
    avatarUrl: 'https://i.pravatar.cc/150?img=44',
    status: 'offline',
    bio: 'Проверяет дублирование кода, переиспользование компонентов, соответствие паттернам. Null safety, edge cases.',
  },
  {
    id: 'tester',
    name: 'Якуб Ковальский',
    role: 'Tester',
    specialty: 'TypeScript, Playwright, E2E',
    location: 'Варшава, Польша',
    flag: '\u{1F1F5}\u{1F1F1}',
    avatarUrl: 'https://i.pravatar.cc/150?img=54',
    status: 'active',
    bio: 'Типы, dev server, Playwright тесты. Пишет новые тесты при необходимости. Error lookup protocol.',
  },
]
