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

## Run locally

1. Start the API with `dotnet run --project Bookify.Api`.
2. In another terminal, start the frontend with `npm --prefix Bookify.Frontend run dev`.
3. Open the frontend URL printed by Vite.

The API uses the local SQL Server connection in `Bookify.Api/appsettings.Development.json`.
