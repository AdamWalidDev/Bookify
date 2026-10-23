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

- Add and view resources and customers.
- Create bookings and check for overlapping bookings.
- Edit booking dates, confirm, cancel, complete, and delete bookings.
- Unavailable resources cannot be booked.
- Pending and confirmed bookings reserve their time slots. Cancelled and completed bookings do not.

## Requirements

- .NET 9 SDK
- SQL Server LocalDB (used by the development connection string)
- Node.js and npm

## Run locally

1. Check the `DefaultConnection` value in `Bookify.Api/appsettings.Development.json`. Update it if your SQL Server instance is different.
2. Restore and run the API: `dotnet run --project Bookify.Api`.
3. On startup, the API applies any pending EF Core migrations and creates the database if needed.
4. In another terminal, start the frontend: `npm --prefix Bookify.Frontend run dev`.
5. Open the frontend URL printed by Vite.

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
