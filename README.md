# Bookify

Bookify is a booking management app built with ASP.NET Core 9 and React.

## Current status

The app supports managing resources, customers, and bookings.

## Project structure

```text
Bookify.Api/
├── Domain/
├── Application/
├── Infrastructure/
└── Controllers/
```

## Features

- Add, view, and edit resources and customers; pause spaces for maintenance.
- Create bookings and check for overlapping bookings.
- Check availability as the selected space or time changes, with conflict feedback before submission and a retry option if the check fails.
- Edit booking dates, confirm, cancel, complete, and delete bookings.
- Unavailable resources cannot be booked.
- Pending and confirmed bookings reserve their time slots. Cancelled and completed bookings do not.
- Login with a JWT token. All `/api/customers`, `/api/resources` and `/api/bookings` endpoints need it.
- Input is validated (required fields, email format, length limits, capacity).
- A customer or resource that has bookings cannot be deleted (the API returns 409).

## Requirements

- .NET 9 SDK
- SQL Server LocalDB (used by the development connection string)
- Node.js and npm

## Run locally

1. Check the `DefaultConnection` value in `Bookify.Api/appsettings.Development.json`. Update it if your SQL Server instance is different.
2. Restore and run the API: `dotnet run --project Bookify.Api`.
3. On startup, the API applies any pending EF Core migrations and creates the database if needed.
4. In another terminal, start the frontend: `npm --prefix Bookify.Frontend run dev`.
5. Open the frontend URL printed by Vite (`http://localhost:5173`).
6. Sign in with the development account `admin` / `admin123` (set in `appsettings.Development.json`).

## Configuration

| Setting | Where | Notes |
|---|---|---|
| `ConnectionStrings:DefaultConnection` | API | SQL Server connection string |
| `Jwt:Key` | API | Secret for signing tokens, at least 32 characters |
| `Jwt:Issuer` | API | Token issuer, default `Bookify` |
| `Admin:Username`, `Admin:Password` | API | The login account |
| `Cors:AllowedOrigins` | API | Frontend URLs that may call the API |
| `VITE_API_URL` | Frontend | API URL, default `http://localhost:5067` (see `.env.example`) |

The development values in `appsettings.Development.json` are only for local use. In production, set the settings with environment variables instead, for example `Jwt__Key`, `Admin__Password` and `Cors__AllowedOrigins__0`.

## Docker

Build and run the API image (it needs a SQL Server and the settings above):

```powershell
docker build -t bookify-api .
docker run -p 8080:8080 -e ConnectionStrings__DefaultConnection="..." -e Jwt__Key="..." -e Admin__Username="..." -e Admin__Password="..." -e Cors__AllowedOrigins__0="http://localhost:5173" bookify-api
```

GitHub Actions (`.github/workflows/ci.yml`) runs the API tests and the frontend lint and build on every push and pull request.

If you already have a database created by an earlier version that used `EnsureCreated`, it does not have EF migration history. Back up and migrate that database before running this version; startup migrations do not automatically adopt it.

To apply migrations manually, run:

```powershell
dotnet ef database update --project Bookify.Api --startup-project Bookify.Api
```

When the data model changes, create a migration with:

```powershell
dotnet ef migrations add <MigrationName> --project Bookify.Api --startup-project Bookify.Api
```

To run the API tests:

```powershell
dotnet test Bookify.Api.Tests/Bookify.Api.Tests.csproj
```

The tests use a temporary SQLite database and do not require SQL Server LocalDB.

## Browser tests

From `Bookify.Frontend`, run:

```powershell
npm ci
npm run test:e2e
```

The suite starts its own frontend on `127.0.0.1:4179` and API on `127.0.0.1:5189`. The API runs in the `E2E` environment with a fresh, shared in-memory SQLite database and test credentials. It never opens your configured application database, and all test data disappears when that API process exits. Existing servers on those ports cause a failure rather than being reused.

Windows uses the installed Google Chrome by default. On other systems, install Chromium first with `npx playwright install chromium`. Set `PLAYWRIGHT_CHANNEL` to select another installed Playwright browser channel. CI installs Chromium and runs the suite automatically.

Coverage includes creating a reservation, rejecting an overlapping request in both the browser and API, cancelling and rebooking the released slot, editing a booking without conflicting with itself, saving resource and customer edits, recovering from duplicate emails, and retrying a failed availability check. Failure screenshots and traces are saved under `Bookify.Frontend/test-results/`.

## Demo data

An empty database is initialized with six spaces, three fictional customers using `example.com` emails, and six reservations covering pending, confirmed, cancelled, and completed states. Future reservations are relative to startup. Existing databases are left unchanged; demo seeding is skipped if resources or customers already exist.
