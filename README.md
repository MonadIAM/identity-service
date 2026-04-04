# identity-service

----

<details>
<summary><strong>Local Deployment</strong></summary>

1. Make sure the [Infra](https://github.com/Lambdius/infra) repository is already running locally.

2. Make sure the `DOCKER_NETWORK_NAME` value in `.env` matches `monitoring-network` or your custom network.

3. Create shared Docker networks for inter-service communication and monitoring:
```sh
docker network create kafka-net
docker network create monitoring-network
```

4. Install the Loki Docker plugin (allows log shipping without extra npm packages):
```sh
docker plugin install grafana/loki-docker-driver:latest --alias loki --grant-all-permissions
```

</details>

----

<details>
<summary><strong>PostgreSQL Streaming Replication</strong></summary>

The service uses `PostgreSQL` in streaming replication mode to improve read performance.

#### Architecture
- *Primary* (`postgresql-primary`) — main write instance (port `5442`)
- *Replica* (`postgresql-replica`) — read-only replica (port `5443`)

#### Checking replication status
```sh
# Check on primary:
docker exec -it access-control-service-postgres-primary psql -U lambdius -d access-control-service -c "SELECT * FROM pg_stat_replication;"
# Check on replica:
docker exec -it access-control-service-postgres-replica psql -U lambdius -d access-control-service -c "SELECT pg_is_in_recovery();"
# Should return `t` (true), meaning the replica is in recovery mode (read-only).
```

</details>

----

<details>
<summary><strong>Project Commands</strong></summary>

| Command                                              | Makefile                  | Description                                           |
|:-----------------------------------------------------|:--------------------------|:------------------------------------------------------|
| **Infrastructure**                                   |                           |                                                       |
| `[ -f .env.example ] && cp -f .env.example .env`     | `make env`                | Generate `.env` from example (if file exists).        |
| `docker-compose up -d`                               | `make up`                 | Start all services in detached mode.                  |
| `docker-compose stop`                                | `make stop`               | Stop containers without removing them.                |
| `docker-compose down`                                | `make down`               | Stop and remove containers and networks.              |
| `docker-compose down && docker-compose up -d`        | `make restart`            | Restart the entire infrastructure.                    |
| `docker-compose build`                               | `make build`              | Build application Docker images.                      |
| `docker-compose logs -f service`                     | `make logs`               | Stream logs from the main service.                    |
| `docker-compose logs -f`                             | `make logs-all`           | Stream combined logs from all services.               |
| `docker-compose ps`                                  | `make ps`                 | Show status of running containers.                    |
| `docker-compose down -v`                             | `make clean`              | Remove containers along with volumes (wipes DB data). |
| `docker system prune -f`                             | `make prune`              | Global cleanup of unused Docker resources.            |
| **Development**                                      |                           |                                                       |
| `npm run lint`                                       | `make lint`               | Run ESLint code checks.                               |
| `npm run lint:fix`                                   | `make lint-fix`           | Auto-fix formatting and log changed files.            |
| **Database**                                         |                           |                                                       |
| `npx mikro-orm migration:create --name=$(name)`      | `make migration name="*"` | Generate a new migration based on entity changes.     |
| `npx mikro-orm migration:up`                         | `make migrate`            | Apply all pending migrations to the database.         |
| `npx mikro-orm seeder:run`                           | `make seed`               | Run the default seeder (`SystemSeeder`).              |
| `npx mikro-orm seeder:run --class=DemoSeeder`        | `make seed-demo`          | Run a specific seeder by class name.                  |
| **Test**                                             |                           |                                                       |
| `npx jest --config ./jest.unit.config.ts`            | `make test`               | Run unit tests.                                       |
| `npx jest --config ./jest.unit.config.ts --coverage` | `make coverage`           | Run unit tests with coverage report.                  |

</details>

----

<details>
<summary><strong>Environment Setup</strong></summary>

> The application requires `Node.js v22.17.0` and `npm v11.6.2`;
> other versions are not supported.

[VSCode](https://code.visualstudio.com/) is the recommended editor for development.

#### VSCode Setup
Install the following extensions for proper [ESLint](https://eslint.org/docs/latest/), [Prettier](https://prettier.io/docs/en/), and [EditorConfig](https://editorconfig.org/) integration:
1. `dbaeumer.vscode-eslint`
2. `rvest.vs-code-prettier-eslint`
3. `esbenp.prettier-vscode`
4. `EditorConfig.EditorConfig`

</details>

----

<details>
<summary><strong>Git Hooks</strong></summary>

*Enable git hooks:*
```sh
chmod +x .githooks/*
git config core.hooksPath .githooks
```

#### Allowed prefixes for commits and branches:
`feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

#### Commit message format:
```text
<type>(<scope>)?[!]: <subject>
```

*Where:*
 - `<type>`    — one of the allowed prefixes above.
 - `<scope>`   — optional scope in parentheses, alphanumeric/`-`.
 - `!`         — optional breaking change marker.
 - `: `        — colon + space are required.
 - `<subject>` — short description.
> Total commit message length is limited to 70 characters.

*Valid commit examples:*
 - `feat: add filters to user search`
 - `fix(auth): handle invalid jwt token`
 - `refactor(user-service)!: drop legacy ws implementation`
 - `docs: update api usage section`
 - `chore(ci): tweak lint step`

#### Branch naming format:
```text
<type>/<slug>
<type>/<scope-or-id>/<slug>
```

*Where:*
 - `<type>`         — one of the prefixes listed above.
 - `/<scope-or-id>` — optional part, alphanumeric/`-`.
 - `/<slug>`        — short description, alphanumeric/`_`/`-`.

*Valid branch examples:*
 - `feat/add-user-search-filters`
 - `fix/schedule-update-ws-event`
 - `refactor/core-user-cleanup`
 - `feat/GOTEC-404/add-notifications-for-users`

> Exceptions: `dev`, `main`, `master`.

</details>

----


{
    "message": "commands.account.CONFIRMED",
    "recoveryCodes": [
        "3EB2-C5A9",
        "273F-E137",
        "6FF0-EA00",
        "9D10-D184",
        "8BA8-2F10",
        "A79D-E4F3",
        "01C6-FA19",
        "4CFA-9F88"
    ]
}
D515-1E9E


Сценарии тестирования
1. Регистрация и вход по паролю:

POST /account/signup → получаем message, OTP на email/phone
POST /account/confirm → получаем session tokens + recovery codes, автологин
POST /session/refresh → ротация токенов
POST /session/purge-all → выход из всех сессий
POST /auth/login → вход заново, получаем session tokens

2. Регистрация с повторной отправкой OTP:

POST /account/signup
POST /account/resend → новый OTP
POST /account/confirm

3. OAuth регистрация (новый пользователь):

GET /auth/oauth/google → получаем URL, redirect
GET /auth/oauth/google/callback?code=...&state=... → получаем session tokens + recovery codes

4. OAuth вход (существующий пользователь):

GET /auth/oauth/google → получаем URL, redirect
GET /auth/oauth/google/callback?code=...&state=... → получаем session tokens

5. OAuth линковка (email совпал с существующим аккаунтом):

POST /account/signup → регистрация по email
POST /account/confirm → активация
GET /auth/oauth/github → redirect
GET /auth/oauth/github/callback?code=...&state=... → OAuth привязан к существующему аккаунту, получаем session tokens

6. Passwordless вход:

POST /identifier/toggle-passwordless → включаем passwordless для email/phone
POST /session/purge-all → выходим
POST /auth/login/otp/request → OTP на email/phone
POST /auth/login/otp/confirm → получаем session tokens

7. Вход с 2FA:

POST /second-factor → получаем QR URI + factorId
POST /second-factor/confirm → подтверждаем TOTP, получаем master code
POST /session/purge-all → выходим
POST /auth/login → получаем { requires2FA: true }, pending token в cookie
POST /auth/login/2fa → TOTP код, получаем session tokens

8. Сброс 2FA по master code:

(2FA настроен, TOTP device потерян)
POST /second-factor/reset → master code, все факторы удалены
POST /auth/login → вход без 2FA, получаем session tokens

9. Смена пароля:

POST /password/change → новый пароль (guard проверит текущий)

10. Сброс пароля по OTP:

POST /password/reset/request → OTP на email/phone
POST /password/reset/otp → новый пароль + OTP код

11. Сброс пароля по recovery code:

POST /password/reset/recovery → новый пароль + recovery code + account id

12. Управление идентификаторами:

POST /identifier → добавляем новый email, OTP отправлен
POST /identifier/resend → повторный OTP
POST /identifier/confirm → верификация
POST /identifier/set-primary → установка как primary (guard проверит пароль)
POST /identifier/toggle-notifications → включаем уведомления
POST /identifier/purge → удаление старого идентификатора

13. Lifecycle 2FA фактора:

POST /second-factor → создание (PENDING)
POST /second-factor/confirm → подтверждение (ACTIVE)
POST /second-factor/revoke → отзыв (REVOKED)
POST /second-factor/restore → восстановление (ACTIVE)
POST /second-factor/revoke → повторный отзыв (REVOKED)
POST /second-factor/purge → удаление всех PENDING/REVOKED

14. Деактивация и автовосстановление:

POST /account/deactivate → аккаунт DEACTIVATED, сессии удалены
POST /auth/login → auto-restore, аккаунт ACTIVE, получаем session tokens

15. Suspend/Unsuspend (admin):

POST /account/suspend → аккаунт SUSPENDED, сессии удалены
POST /auth/login → ошибка ACCOUNT_SUSPENDED
POST /account/unsuspend → аккаунт ACTIVE
POST /auth/login → вход успешен

16. Обновление профиля:

POST /profile/update → patch displayName, locale, timeZone, pictureUrl
