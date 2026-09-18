# Hotel Reservation System

CSE 3206 (Software Engineering Sessional) — Lab 2, Group #09, Section A, RUET.
Scenario 9: Hotel Reservation System. Process model: **Rapid Application Development (RAD)**.

## Team

| Member | GitHub | Module |
| --- | --- | --- |
| Shirshen | [@shu-vro](https://github.com/shu-vro) | Platform core, authentication, UI shell |
| Shahrirar Hasan | [@Shahrirar-Hasan](https://github.com/Shahrirar-Hasan) | Rooms module |
| Riyon Chowdhury | [@Riyon-Chowdhury](https://github.com/Riyon-Chowdhury) | Bookings module |

## Stack

- Frontend: Vite (vanilla JS), hash router, plain CSS
- Backend: Express 5
- Database: SQLite through Node's built-in `node:sqlite`

## Running it

```bash
npm install
npm run dev
```

Vite serves the UI on <http://localhost:5173> and proxies `/api` to the Express server on port 3001.
