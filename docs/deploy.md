# rubleapi.ru — deploy guide

## 1. цель

документ описывает базовый деплой проекта rubleapi.ru на vps.

проект должен работать как отдельное node.js-приложение за nginx:

```text
https://rubleapi.ru → nginx → 127.0.0.1:3000
```

## 2. серверный путь проекта

рекомендуемый путь:

```bash
/var/www/rubleapi
```

если на сервере уже есть другой проект, структура может быть такой:

```bash
/var/www/tildaseo
/var/www/rubleapi
```

каждый проект должен иметь:

```text
отдельную папку
отдельный systemd-сервис
отдельный nginx server block
отдельный локальный порт
```

## 3. требования к серверу

минимально:

```text
ubuntu 22.04 или новее
node.js 20 lts
npm
git
nginx
certbot
```

проверка версий:

```bash
node -v
npm -v
git --version
nginx -v
```

## 4. получение кода

если репозиторий ещё не склонирован:

```bash
cd /var/www
git clone repository_url rubleapi
cd /var/www/rubleapi
```

если проект уже есть на сервере:

```bash
cd /var/www/rubleapi
git status
git pull
```

перед `git pull` обязательно проверить, нет ли локальных незакоммиченных изменений.

если на сервере есть локальные изменения, сначала разобраться, что это за изменения. не делать `git pull` вслепую.

## 5. установка зависимостей

```bash
cd /var/www/rubleapi
npm install
```

## 6. production env

на сервере создать файл:

```bash
/var/www/rubleapi/.env
```

пример содержимого:

```env
node_env=production
port=3000
database_path=/var/www/rubleapi/data/rubleapi.sqlite
public_base_url=https://rubleapi.ru
rates_sync_interval_hours=6
```

файл `.env` не должен попадать в git.

в git должен лежать только пример:

```bash
.env.example
```

## 7. папка для базы данных

создать папку для sqlite-базы:

```bash
mkdir -p /var/www/rubleapi/data
```

если приложение запускается от пользователя `www-data`, выдать права:

```bash
chown -r www-data:www-data /var/www/rubleapi/data
```

если сервис запускается от другого пользователя, заменить `www-data` на фактического пользователя.

база sqlite не должна храниться в git и не должна перетираться при `git pull`.

## 8. сборка проекта

```bash
cd /var/www/rubleapi
npm run build
```

после сборки должен существовать файл:

```bash
dist/app/server.js
```

проверка:

```bash
ls dist/app
```

## 9. ручной запуск для проверки

```bash
cd /var/www/rubleapi
npm start
```

в другом терминале проверить:

```bash
curl http://127.0.0.1:3000/health
curl http://127.0.0.1:3000/
curl http://127.0.0.1:3000/widget
curl http://127.0.0.1:3000/docs
curl "http://127.0.0.1:3000/api/rates/latest?symbols=usd,eur,cny"
```

если всё отвечает корректно, остановить ручной запуск:

```text
ctrl+c
```

## 10. systemd service

создать файл:

```bash
/etc/systemd/system/rubleapi.service
```

содержимое:

```ini
[unit]
description=rubleapi node.js service
after=network.target

[service]
type=simple
workingdirectory=/var/www/rubleapi
execstart=/usr/bin/npm start
restart=always
restartsec=5
environment=node_env=production
user=www-data
group=www-data

[install]
wantedby=multi-user.target
```

если `npm` находится не в `/usr/bin/npm`, проверить путь:

```bash
which npm
```

и заменить `execstart` на фактический путь.

после создания сервиса:

```bash
systemctl daemon-reload
systemctl enable rubleapi
systemctl start rubleapi
systemctl status rubleapi
```

проверка:

```bash
curl http://127.0.0.1:3000/health
```

логи:

```bash
journalctl -u rubleapi -n 100 --no-pager
```

перезапуск:

```bash
systemctl restart rubleapi
systemctl status rubleapi
```

## 11. nginx server block

создать конфиг:

```bash
/etc/nginx/sites-available/rubleapi.ru
```

содержимое:

```nginx
server {
    listen 80;
    server_name rubleapi.ru www.rubleapi.ru;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;

        proxy_set_header host $host;
        proxy_set_header x-real-ip $remote_addr;
        proxy_set_header x-forwarded-for $proxy_add_x_forwarded_for;
        proxy_set_header x-forwarded-proto $scheme;
    }
}
```

включить сайт:

```bash
ln -s /etc/nginx/sites-available/rubleapi.ru /etc/nginx/sites-enabled/rubleapi.ru
nginx -t
systemctl reload nginx
```

если файл в `sites-enabled` уже существует, повторно ссылку не создавать.

## 12. dns

домен `rubleapi.ru` должен указывать a-записью на ip сервера.

проверить:

```bash
dig rubleapi.ru
```

или:

```bash
nslookup rubleapi.ru
```

если dns ещё не обновился, ssl через certbot может не выпуститься.

## 13. ssl через certbot

после того как dns указывает на сервер и nginx отдаёт сайт по http:

```bash
certbot --nginx -d rubleapi.ru -d www.rubleapi.ru
```

проверить автообновление:

```bash
certbot renew --dry-run
```

## 14. проверка после деплоя

```bash
curl https://rubleapi.ru/health
curl https://rubleapi.ru/
curl https://rubleapi.ru/widget
curl https://rubleapi.ru/docs
curl "https://rubleapi.ru/api/rates/latest?symbols=usd,eur,cny"
```

ожидаемо:

```text
/health — 200
/ — html главной
/widget — html генератора виджета
/docs — html документации
/api/rates/latest — json с курсами
```

## 15. обновление проекта на сервере

```bash
cd /var/www/rubleapi
git status
git pull
npm install
npm run build
systemctl restart rubleapi
systemctl status rubleapi
```

после обновления:

```bash
curl https://rubleapi.ru/health
curl "https://rubleapi.ru/api/rates/latest?symbols=usd,eur,cny"
```

## 16. что не коммитить

не коммитить:

```text
.env
node_modules/
dist/
*.sqlite
*.sqlite3
*.db
*.log
```

проверить `.gitignore`:

```bash
cat .gitignore
```

перед коммитом всегда проверять:

```bash
git status
```

## 17. соседние проекты на том же сервере

если на сервере уже работает другой проект, например tildaseo, не менять его конфиги без необходимости.

перед настройкой проверить:

```bash
ls /var/www
nginx -t
systemctl status nginx
systemctl list-units --type=service | grep tilda
```

rubleapi должен иметь:

```text
отдельную папку: /var/www/rubleapi
отдельный сервис: rubleapi.service
отдельный nginx-конфиг: rubleapi.ru
свой локальный порт: 3000 или другой свободный порт
```

если порт `3000` уже занят другим проектом, выбрать другой порт и указать его в `.env`, systemd и nginx.

проверка занятых портов:

```bash
ss -ltnp
```

## 18. rollback

если после обновления проект не запускается, посмотреть последние коммиты:

```bash
cd /var/www/rubleapi
git log --oneline -5
```

откатиться на нужный хеш коммита:

```bash
git reset --hard commit_hash
npm install
npm run build
systemctl restart rubleapi
```

после rollback:

```bash
systemctl status rubleapi
curl https://rubleapi.ru/health
```

## 19. базовый порядок деплоя

кратко:

```bash
cd /var/www
git clone repository_url rubleapi
cd /var/www/rubleapi
npm install
cp .env.example .env
mkdir -p /var/www/rubleapi/data
npm run build
npm start
```

после ручной проверки:

```bash
systemctl daemon-reload
systemctl enable rubleapi
systemctl start rubleapi
nginx -t
systemctl reload nginx
certbot --nginx -d rubleapi.ru -d www.rubleapi.ru
```

финальная проверка:

```bash
curl https://rubleapi.ru/health
curl https://rubleapi.ru/
curl https://rubleapi.ru/widget
curl https://rubleapi.ru/docs
curl "https://rubleapi.ru/api/rates/latest?symbols=usd,eur,cny"
```