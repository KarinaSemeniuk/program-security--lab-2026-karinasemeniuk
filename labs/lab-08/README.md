# Лабораторна №8 — OpenSSL та ліцензування

Експеримент виконано OpenSSL 3.5.9 командами з методички: RSA 3072, RSA-PSS/SHA-256, saltlen:digest при підписуванні та saltlen:auto при перевірці.

- Справжній `license.json`: `Verified OK`, код завершення 0.
- Строк дії змінено з 2027 на 2030 рік без нового підпису: `Verification failure`, код 1.
- Підпис має довжину 384 байти.

Повні дані та журнал команд — `openssl-results.json`, `openssl-output.txt`. `license-tampered.json` містить окрему підмінену копію; `license.json` залишається справжнім. Відкритий ключ і підпис збережено. Навчальний `private.pem` існував у тимчасовому каталозі під час досліду та видалений; він не потрапляє до Git або звіту. Скрипт не читає `.env`, ключі або ліцензію RoomBook.

Відтворення з кореня репозиторію:

```bash
node labs/lab-08/openssl-license-experiment.mjs
```

Кожен запуск створює нову навчальну пару ключів та замінює сусідні результати. Потрібні Node.js 22 та OpenSSL 3.x; додаткові npm-пакети не потрібні.

Для незалежної перевірки з папки результатів:

```bash
openssl dgst -sha256 -verify public.pem -signature license.sig -sigopt rsa_padding_mode:pss -sigopt rsa_pss_saltlen:auto license.json
openssl dgst -sha256 -verify public.pem -signature license.sig -sigopt rsa_padding_mode:pss -sigopt rsa_pss_saltlen:auto license-tampered.json
```

Другий виклик має повернути код 1: це очікувана відмова при підміні. Новий підпис підміненої ліцензії не створювався.
