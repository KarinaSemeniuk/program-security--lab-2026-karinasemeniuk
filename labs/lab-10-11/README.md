# Лабораторна 10–11

Запустіть наданий викладачем lab6_library_server.py через Python 3 на 127.0.0.1:8080. Файл сервера не змінюється. Облікові дані варіанта 8 наведено в додатку А методички. Передайте їх як LIBRARY_CLIENT_ID і LIBRARY_CLIENT_SECRET для CLI. Запуск клієнта: node labs/lab-10-11/library-client.mjs. Тести: node --test labs/lab-10-11/library-client.test.mjs.

Для графічного клієнта запустіть статичний сервер лише на loopback у цьому каталозі та відкрийте index.html. Введіть дані варіанта. Токен і секрет не записуються у сховище браузера. Клієнт отримує /whoami, /api/books, /api/loans, /api/summary. Деталь книги можна прочитати через client.get('/api/books/BK-08-01').
