---
kind: upgrade-guide
description: "Built-in application and installer languages are limited to English and Chinese."
---

# Built-in application languages

English | [中文](guide.zh.md)

## Change

The application, Desktop shell, plugin metadata and Windows installer ship English and Chinese only. Japanese, Spanish, French, German, Russian and Portuguese are removed from the built-in language selector and distribution resources. Windows installer tests exercise the two retained languages.

Existing preferences for removed languages remain stored. The interface resolves an available browser or operating-system language and otherwise falls back to English. Plugin-provided language registration remains available.

## Migration

1. Open the language setting and choose English or Chinese if the previous selection is unavailable.
2. Confirm the language selector lists the two built-in choices and the interface uses the selected language.
3. Developers run `node apps/desktop/scripts/installer-locales.mjs` to confirm the installer contains two languages.
