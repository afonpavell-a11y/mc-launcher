export type Lang = 'ru' | 'en' | 'uk';

export const translations = {
  ru: {
    hello: 'Привет', home: 'Главная', search: 'Поиск', library: 'Библиотека', profiles: 'Профили', settings: 'Настройки',
    play: 'Играть', selectVersion: 'Выбрать версию', createInstance: 'Создать инстанс', loading: 'Загрузка...',
    noInstances: 'У вас пока нет установленных версий. Нажмите "+" в сайдбаре.',
    myInstances: 'Мои инстансы', theme: 'Тема', dark: 'Тёмная', light: 'Светлая', system: 'Системная', sounds: 'Звуки',
    interface: 'Интерфейс', appearance: 'Внешний вид', particles: 'Частицы', memory: 'Память', java: 'Java',
    language: 'Язык', close: 'Закрыть', background: 'Фон', accentColor: 'Акцентный цвет',
    particleType: 'Тип частиц', count: 'Количество', speed: 'Скорость',
    maxRam: 'Максимум ОЗУ', javaPath: 'Путь к Java', autoJava: 'Автоматически',
    addProfile: 'Добавить профиль', uploadSkin: 'Загрузить скин', nickname: 'Никнейм',
  },
  en: {
    hello: 'Hello', home: 'Home', search: 'Search', library: 'Library', profiles: 'Profiles', settings: 'Settings',
    play: 'Play', selectVersion: 'Select version', createInstance: 'Create instance', loading: 'Loading...',
    noInstances: 'No installed versions. Click "+" in the sidebar.',
    myInstances: 'My instances', theme: 'Theme', dark: 'Dark', light: 'Light', system: 'System', sounds: 'Sounds',
    interface: 'Interface', appearance: 'Appearance', particles: 'Particles', memory: 'Memory', java: 'Java',
    language: 'Language', close: 'Close', background: 'Background', accentColor: 'Accent color',
    particleType: 'Particle type', count: 'Count', speed: 'Speed',
    maxRam: 'Max RAM', javaPath: 'Java path', autoJava: 'Automatic',
    addProfile: 'Add profile', uploadSkin: 'Upload skin', nickname: 'Nickname',
  },
  uk: {
    hello: 'Привіт', home: 'Головна', search: 'Пошук', library: 'Бібліотека', profiles: 'Профілі', settings: 'Налаштування',
    play: 'Грати', selectVersion: 'Обрати версію', createInstance: 'Створити інстанс', loading: 'Завантаження...',
    noInstances: 'Немає встановлених версій. Натисніть "+" у бічній панелі.',
    myInstances: 'Мої інстанси', theme: 'Тема', dark: 'Темна', light: 'Світла', system: 'Системна', sounds: 'Звуки',
    interface: 'Інтерфейс', appearance: 'Зовнішній вигляд', particles: 'Частинки', memory: 'Пам\'ять', java: 'Java',
    language: 'Мова', close: 'Закрити', background: 'Фон', accentColor: 'Акцентний колір',
    particleType: 'Тип частинок', count: 'Кількість', speed: 'Швидкість',
    maxRam: 'Максимум ОЗП', javaPath: 'Шлях до Java', autoJava: 'Автоматично',
    addProfile: 'Додати профіль', uploadSkin: 'Завантажити скін', nickname: 'Нікнейм',
  },
};

export function t(lang: Lang, key: keyof typeof translations['ru']): string {
  return translations[lang]?.[key] || translations['ru'][key] || key;
}