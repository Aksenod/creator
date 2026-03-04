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
    specialty: 'Координация, оркестрация',
    location: 'RU Москва',
    flag: '🇷🇺',
    avatarUrl: 'https://i.pravatar.cc/150?img=12',
    status: 'active',
    bio: 'Единственная точка контакта с клиентом. Принимает запросы, оценивает сложность и решает какие фазы запускать. Делегирует задачи Researcher и Architect, контролирует quality gates, управляет deploy.',
  },
  {
    id: 'researcher',
    name: 'Мария Ковалёва',
    role: 'Researcher',
    specialty: 'Анализ кодовой базы, паттерны',
    location: 'RU Санкт-Петербург',
    flag: '🇷🇺',
    avatarUrl: 'https://i.pravatar.cc/150?img=5',
    status: 'active',
    bio: 'Запускается первой в начале каждой задачи. Исследует кодовую базу, находит переиспользуемые компоненты и паттерны. Передаёт карту зависимостей Architect и список паттернов Code Reviewer для валидации.',
  },
  {
    id: 'competitor-analyst',
    name: 'Дмитрий Шульц',
    role: 'Competitor Analyst',
    specialty: 'Figma, Webflow, Framer',
    location: 'DE Берлин',
    flag: '🇩🇪',
    avatarUrl: 'https://i.pravatar.cc/150?img=53',
    status: 'busy',
    bio: 'Исследует как фичи реализованы у Figma, Webflow и Framer. Анализирует документацию, форумы и UI через Figma MCP. Собирает best practices и UX-паттерны, передаёт инсайты Architect и Designer.',
  },
  {
    id: 'architect',
    name: 'Андрей Сергеев',
    role: 'Architect',
    specialty: 'Проектирование, архитектура',
    location: 'RU Новосибирск',
    flag: '🇷🇺',
    avatarUrl: 'https://i.pravatar.cc/150?img=60',
    status: 'active',
    bio: 'Получает результаты от Researcher и Analyst. Проектирует пошаговый план реализации, определяет затрагиваемые файлы и выбирает подход. Согласует layout-стратегию с Layout Engineer, передаёт план PM.',
  },
  {
    id: 'designer',
    name: 'Нино Мерабишвили',
    role: 'Designer',
    specialty: 'UI/UX, мокапы, визуал',
    location: 'GE Тбилиси',
    flag: '🇬🇪',
    avatarUrl: 'https://i.pravatar.cc/150?img=25',
    status: 'active',
    bio: 'Создаёт .pen мокапы по плану Architect. Визуально валидирует каждый экран через скриншоты. Передаёт макеты Layout Engineer для контроля качества и PM для design review.',
  },
  {
    id: 'layout-engineer',
    name: 'Рустам Хакимов',
    role: 'Layout Engineer',
    specialty: 'Grid, Flex, responsive',
    location: 'RU Казань',
    flag: '🇷🇺',
    avatarUrl: 'https://i.pravatar.cc/150?img=51',
    status: 'active',
    bio: 'Контролирует layout-first подход на всех этапах. Определяет Grid vs Flex стратегию в плане Architect, проверяет вложенность и responsive при реализации, подтверждает quality на code review.',
  },
  {
    id: 'code-reviewer',
    name: 'Ольга Новак',
    role: 'Code Reviewer',
    specialty: 'Качество, паттерны, DRY',
    location: 'BY Минск',
    flag: '🇧🇾',
    avatarUrl: 'https://i.pravatar.cc/150?img=44',
    status: 'offline',
    bio: 'Запускается после реализации. Проверяет дублирование кода, переиспользование компонентов и соответствие паттернам из memory. Валидирует null safety, edge cases, сверяет с рекомендациями Researcher.',
  },
  {
    id: 'tester',
    name: 'Якуб Ковальский',
    role: 'Tester',
    specialty: 'TypeScript, Vitest, Playwright, E2E',
    location: 'PL Варшава',
    flag: '🇵🇱',
    avatarUrl: 'https://i.pravatar.cc/150?img=54',
    status: 'active',
    bio: 'Финальная проверка перед деплоем. Запускает tsc, Vitest unit-тесты для утилит и Playwright E2E-тесты. Пишет новые тесты при необходимости. Применяет error lookup protocol, передаёт результаты PM.',
  },
]
