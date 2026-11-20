// Модель-таблица «Язык — фреймворк».
// Каждая строка описывает один стек и параметры для его поиска в репозитории:
//   extensions  — какие расширения файлов считаем кодом этого языка (шаг 1)
//   manifests   — файлы со списком зависимостей (шаги 2 и 3)
//   configFiles — файлы настроек, которые читаем и проверяем (шаги 2 и 3)
//   layer       — 'frontend' или 'backend'
// Позже эта таблица переедет в базу данных, а страница будет получать её с сервера.
export const FRAMEWORK_MODEL = [
  {
    id: 'js-react',
    language: 'JavaScript',
    framework: 'React',
    layer: 'frontend',
    extensions: ['.js', '.jsx'],
    manifests: ['package.json'],
    configFiles: ['vite.config.js', '.env'],
  },
  {
    id: 'py-django',
    language: 'Python',
    framework: 'Django',
    layer: 'backend',
    extensions: ['.py'],
    manifests: ['requirements.txt', 'pyproject.toml'],
    configFiles: ['settings.py', '.env'],
  },
  {
    id: 'java-spring',
    language: 'Java',
    framework: 'Spring Boot',
    layer: 'backend',
    extensions: ['.java'],
    manifests: ['pom.xml', 'build.gradle'],
    configFiles: ['application.properties', 'application.yml'],
  },
  {
    id: 'php-laravel',
    language: 'PHP',
    framework: 'Laravel',
    layer: 'backend',
    extensions: ['.php'],
    manifests: ['composer.json'],
    configFiles: ['.env', 'config/*.php'],
  },
  {
    id: 'cs-aspnet',
    language: 'C#',
    framework: 'ASP.NET Core',
    layer: 'backend',
    extensions: ['.cs'],
    manifests: ['*.csproj'],
    configFiles: ['appsettings.json'],
  },
];
