# Privacy Policy – Easy Screenshot Extension

**Last updated:** 2025  
**Version:** 1.0

## 📋 Overview

Easy Screenshot ("we", "our", "the extension") respects your privacy and is committed to protecting your personal data. This privacy policy explains how we collect, use, and protect information when you use our Chrome extension.

## 🔒 Data Collection

### We DO NOT collect:
- **Personal data** – name, email, address, phone
- **Screenshots** – all images are created locally in your browser
- **Browsing history** – we do not track your website visits
- **Files** – all files remain on your device or in your Google account

### We may collect:
- **Anonymous usage statistics** – only to improve functionality
- **Technical information** – browser version, operating system (only in case of errors)

## 🎯 Data Usage

### Local data:
- **Extension settings** – stored locally in your browser
- **Screenshots** – created and processed only on your device
- **Cache** – temporary data to improve performance

### Google services:
- **Google Drive** – only if you choose to save to Google Drive
- **Google Docs** – only if you choose to create a document
- **OAuth authorization** – for secure access to your Google services

## 🔐 Security

### Data protection:
- **Local processing** – all screenshots are created locally
- **Encryption** – data is transmitted over secure connections
- **Minimal permissions** – we request only the necessary permissions

### Extension permissions:
- **activeTab** – access to the active tab for taking screenshots
- **storage** – save settings in your browser
- **scripting** – execute scripts for taking screenshots
- **notifications** – notify about completed operations
- **tabs** – manage tabs for taking screenshots
- **identity** – secure Google account authorization

## 🌐 Third-Party Services

### Google services:
- **Google Drive API** – for saving files (only at your request)
- **Google Docs API** – for creating documents (only at your request)
- **OAuth 2.0** – for secure authorization

### We DO NOT use:
- Ad networks
- Analytics services
- Tracking scripts
- Third-party CDNs

## 📱 Data Storage

### Local storage:
- **Settings** – in the browser's local storage
- **Cache** – temporary files in the browser
- **Screenshots** – only if you save them

### Cloud storage:
- **Google Drive** – only if you choose to save
- **Google Docs** – only if you create documents

## 🗑️ Data Deletion

### Automatic deletion:
- **Cache** – cleared automatically
- **Temporary files** – deleted when the browser is closed

### Manual deletion:
- **Settings** – deleted when the extension is removed
- **Google data** – managed through your Google account

## 👥 User Rights

### You have the right to:
- **Access** – know what data we store
- **Correction** – correct inaccurate data
- **Deletion** – delete your data
- **Portability** – get a copy of your data
- **Restriction** – limit data processing

### How to exercise your rights:
- **Removing the extension** – automatically deletes all local data
- **Google account** – manage data through Google settings
- **Contact us** – reach out for other requests

## 🔄 Policy Changes

### Notifications:
- **Significant changes** – we will notify through the extension
- **Updates** – we will publish in the Chrome Web Store
- **Date** – we always indicate the date of the last update

### Consent:
- **Continued use** – means you agree to the changes
- **Disagreement** – please uninstall the extension

## 📞 Contact

### For privacy questions:
- **Email:** dimsp1369@gmail.com
- **GitHub:** https://github.com/dimsp1369/easyScreenShot_cws
- **Chrome Web Store:** [extension page link]

### Response time:
- **General inquiries** – within 48 hours
- **Urgent inquiries** – within 24 hours

## ⚖️ Legal Information

### Applicable law:
- **Primary** – data protection laws of your country
- **Additional** – GDPR (for EU users)

### Disputes:
- **Resolution** – we will try to resolve amicably first
- **Arbitration** – if necessary, through the appropriate authorities

## 📋 Consent

By using Easy Screenshot, you agree to this privacy policy. If you do not agree with any provisions, please do not use the extension.

---

**Last updated:** 2025  
**Policy version:** 1.0  
**Status:** Active 

Для расширения Chrome, которое вы планируете публиковать в Chrome Web Store, **рекомендую создать ПУБЛИЧНЫЙ репозиторий**. Вот почему:

## 🔑 Преимущества публичного репозитория:

### **1. Соответствие требованиям Chrome Web Store:**
- **CWS требует** публичную ссылку на Privacy Policy
- **GitHub Pages** работает только с публичными репозиториями
- **Прозрачность** повышает доверие пользователей

### **2. Сообщество и развитие:**
- **Другие разработчики** могут изучать ваш код
- **Bug reports** и feature requests от сообщества
- **Contributions** и улучшения от других разработчиков
- **Forking** для создания вариаций расширения

### **3. Демонстрация навыков:**
- **Портфолио** для потенциальных работодателей
- **Пример кода** для других проектов
- **Документирование** вашего опыта разработки

## ⚠️ Что нужно учесть:

### **Безопасность:**
- **Client ID** в `manifest.json` - это development ID, безопасен для публикации
- **Никаких секретов** (API keys, passwords) в коде
- **Все sensitive данные** должны быть в environment variables или .env файлах (которые в .gitignore)

### **Правильная структура:**
```
widjet/
├── manifest.json          ✅ Development Client ID
├── background.js          ✅ Основной код
├── content.js             ✅ Content script
├── popup.js               ✅ Popup логика
├── google-docs-api.js     ✅ Google API интеграция
├── .gitignore             ✅ Исключает sensitive файлы
├── README.md              ✅ Документация
├── PRIVACY_POLICY.md      ✅ Privacy Policy
└── icons/                 ✅ Иконки
```

## 📋 .gitignore файл:

```gitignore
# Sensitive files
.env
.env.local
.env.production
secrets.json
config.json

# Development files
node_modules/
*.log
.DS_Store

# Production builds
dist/
build/
*.zip

# IDE files
.vscode/
.idea/
*.swp
*.swo
```

## 📋 Рекомендуемый план:

### **Сейчас:**
1. **Создайте публичный репозиторий** `widjet`
2. **Загрузите код** с development Client ID
3. **Настройте GitHub Pages** для Privacy Policy

### **После публикации в CWS:**
1. **Обновите README** с ссылкой на Chrome Web Store
2. **Добавьте информацию** о production vs development версиях
3. **Укажите**, что GitHub версия для разработки

## ✅ Итоговая рекомендация:

**Создайте ПУБЛИЧНЫЙ репозиторий** - это стандартная практика для open-source расширений Chrome и соответствует всем требованиям Chrome Web Store.

**Публичный репозиторий = больше возможностей + соответствие требованиям CWS + развитие сообщества.** 