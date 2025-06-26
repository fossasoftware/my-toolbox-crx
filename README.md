# My ToolBox / Мій Тулбокс

**Chrome Extension**

[English](#english) | [Українська](#українська)

---

## English

**My ToolBox** is a browser extension for Chrome designed to enhance the workflow for Service Center specialists, primarily focusing on Jira Cloud modifications and providing handy tools like a built-in notepad.

**Version:** 4.4.5
**Author:** Vitalii Kopach

### Features

* **Jira Status Colorizer:**
  * Customize the background and text colors of Jira issue statuses on boards, lists, and issue pages (`*://*.atlassian.net/*`).
  * Apply optional animated "ribbon" effects to statuses.
  * Configure primary and secondary colors for animations.
  * Import and Export your color presets as JSON files for easy sharing or backup.
* **Row Highlighter:**
  * Highlight table rows in Jira issue lists when a word or phrase matches.
  * Choose a custom highlight color for each keyword.
  * Enable or disable keywords without removing them.
  * Import and Export your highlight rules as JSON.
* **Notepad:**
  * A simple, integrated notepad accessible from the extension's options page.
  * Supports Markdown formatting with a live preview.
  * Automatically saves content as you type.
  * Synced scrolling between editor and preview panes.
* **Localization:**
  * Interface available in English and Ukrainian, selectable from the options page.

### Installation

1. **(Recommended) From Chrome Web Store:**
    * Installation via the Chrome Web Store is currently limited **only to registered testers** using a specific testing link. If you wish to become a tester, please provide your Google account email address to be added to the tester list.
2. **(Manual) Load Unpacked Extension:**
    * Clone or download this repository: `git clone <repository-url>`
    * Open Chrome and navigate to `chrome://extensions/`.
    * Enable "Developer mode" (toggle switch in the top right corner).
    * Click the "Load unpacked" button.
    * Select the directory where you cloned/downloaded the repository (the one containing the `manifest.json` file).

### Usage

1. Click the My ToolBox icon in your Chrome toolbar to open the popup.
2. Click "Open Settings" in the popup. Alternatively, navigate to `chrome://extensions/`, find My ToolBox, click "Details", and then "Extension options".
3. Use the tabs within the options page:
    * **Status Colorizer:** Add/edit/delete status rules using the table. Choose background/text colors, enable/disable animation, and set animation colors. Use the "Import" and "Export" buttons to manage presets. Click "Save Changes" to apply settings. Use "Defaults" to restore the default color set or "Reset" to clear the table.
    * **Notepad:** Type your notes using Markdown in the left pane. A live preview appears in the right pane. Content is saved automatically to your browser's sync storage.
4. Select your preferred language (EN/UK) using the toggle switch in the options page header.
5. The Status Colorizer will automatically apply colors to Jira statuses when you browse matching Atlassian domains (`*://*.atlassian.net/*`). Changes might require a page refresh to take effect initially.

### Technical Details

* Built on **Manifest V3** with content scripts (`status-colorizer-worker.js` and `row-highlighter-worker.js`) that inject CSS into Atlassian pages.
* All user settings are stored via `chrome.storage.sync` for automatic cross-device synchronization.
* The notepad preview relies on [`marked.js`](libs/marked.min.js) and sanitizes HTML output with [`DOMPurify`](libs/purify.min.js).
* Import and export actions simply read or write JSON files containing your configuration.
* Source files for each tool reside inside the `features` directory.

---

## Українська

**Мій Тулбокс** – це розширення для браузера Chrome, створене для покращення робочого процесу спеціалістів Сервісного Центру. Воно зосереджене на модифікаціях Jira Cloud та надає зручні інструменти, такі як вбудований нотатник.

**Версія:** 4.4.5
**Автор:** Віталій Копач

### Можливості

* **Колоризатор Статусів Jira:**
  * Налаштуйте колір фону та тексту статусів задач Jira на дошках, у списках та на сторінках задач (`*://*.atlassian.net/*`).
  * Застосовуйте опціональні анімовані ефекти "стрічки" до статусів.
  * Налаштуйте основний та вторинний кольори для анімацій.
  * Імпортуйте та експортуйте ваші налаштування кольорів у форматі JSON для легкого обміну чи резервного копіювання.
* **Підсвічування Рядків:**
  * Виділяйте рядки у списках Jira, якщо вони містять задані слова чи фрази.
  * Для кожного слова можна обрати індивідуальний колір підсвічування.
  * Можна вмикати або вимикати ключові слова без їх видалення.
  * Підтримується імпорт та експорт правил у форматі JSON.
* **Нотатник:**
  * Простий, інтегрований нотатник, доступний зі сторінки налаштувань розширення.
  * Підтримує форматування Markdown з живим попереднім переглядом.
  * Автоматично зберігає вміст під час введення тексту.
  * Синхронізоване прокручування між панеллю редактора та попереднього перегляду.
* **Локалізація:**
  * Інтерфейс доступний англійською та українською мовами, вибір здійснюється на сторінці налаштувань.

### Встановлення

1. **(Рекомендовано) З Chrome Web Store:**
    * Наразі встановлення через Chrome Web Store **обмежене та доступне тільки для зареєстрованих тестувальників** за спеціальним тестовим посиланням. Якщо ви бажаєте стати тестувальником, будь ласка, надайте email-адресу вашого Google-акаунту для додавання до списку тестувальників.
2. **(Вручну) Завантажити розпаковане розширення:**
    * Клонуйте або завантажте цей репозиторій: `git clone <repository-url>`
    * Відкрийте Chrome та перейдіть до `chrome://extensions/`.
    * Увімкніть "Режим розробника" (перемикач у верхньому правому куті).
    * Натисніть кнопку "Завантажити розпаковане розширення".
    * Виберіть директорію, куди ви клонували/завантажили репозиторій (ту, що містить файл `manifest.json`).

### Використання

1. Натисніть іконку "Мій Тулбокс" на панелі інструментів Chrome, щоб відкрити спливаюче вікно.
2. Натисніть "Відкрити налаштування" у спливаючому вікні. Або ж перейдіть до `chrome://extensions/`, знайдіть "Мій Тулбокс", натисніть "Деталі", а потім "Параметри розширення".
3. Використовуйте вкладки на сторінці налаштувань:
    * **Колоризатор Статусів:** Додавайте/редагуйте/видаляйте правила для статусів за допомогою таблиці. Вибирайте кольори фону/тексту, вмикайте/вимикайте анімацію та встановлюйте її кольори. Використовуйте кнопки "Імпорт" та "Експорт" для керування пресетами. Натисніть "Зберегти" для застосування налаштувань. Використовуйте "За замовчуванням" для відновлення типового набору кольорів або "Скинути" для очищення таблиці.
    * **Підсвічування Рядків:** Додавайте ключові слова та обирайте колір, яким буде підсвічено рядок, якщо воно зустрінеться. Можна імпортувати та експортувати правила у форматі JSON.
    * **Нотатник:** Вводьте нотатки, використовуючи Markdown, у лівій панелі. Живий попередній перегляд з'явиться у правій панелі. Вміст автоматично зберігається у сховищі синхронізації вашого браузера.
4. Виберіть бажану мову (EN/UK) за допомогою перемикача у заголовку сторінки налаштувань.
5. Колоризатор Статусів автоматично застосовуватиме кольори до статусів Jira під час перегляду відповідних доменів Atlassian (`*://*.atlassian.net/*`). Зміни можуть потребувати оновлення сторінки для початкового застосування.

### Технічні деталі

* Розширення побудоване на основі **Manifest V3** та використовує скрипти `status-colorizer-worker.js` і `row-highlighter-worker.js` як контент-скрипти для вставки стилів на сторінки Atlassian.
* Усі налаштування зберігаються через `chrome.storage.sync`, тому вони синхронізуються між вашими браузерами.
* Для попереднього перегляду Markdown застосовується [`marked.js`](libs/marked.min.js), а результуючий HTML очищається за допомогою [`DOMPurify`](libs/purify.min.js).
* Імпорт та експорт правил здійснюється через JSON‑файли з вашими налаштуваннями.
* Вихідні файли кожного інструменту знаходяться у папці `features`.
