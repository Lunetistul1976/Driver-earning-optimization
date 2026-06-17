# Ride Planner — Călărași Driver Earnings Optimizer

Web app that helps a Bolt/Uber driver in Călărași maximize earnings per hour using historical rides, location, time of day, traffic, and weather.

## Stack

- **Frontend:** React, TypeScript, Styled Components, TanStack Query, React Router, Leaflet
- **Backend:** Node.js, Express, TypeScript, Prisma
- **Database:** PostgreSQL

## Quick Start

### 1. Start PostgreSQL

PostgreSQL runs on port **5433** (to avoid conflicts with a local Postgres on 5432).

```bash
docker compose up -d
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env
npm install
npm run db:push
npm run db:seed
npm run dev
```

Backend runs at `http://localhost:3001`.

### 3. Frontend

From the project root:

```bash
npm install
npm start
```

Frontend runs at `http://localhost:3000` and proxies API calls to the backend.

## Features

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/` | Today's earnings, $/hour, best zone, best hours chart |
| Live Map | `/heatmap` | Zones, profitability colors, driver position |
| Ride Log | `/rides` | Accept/complete rides, fare logging |
| Analytics | `/analytics` | Revenue by hour, weekday, zone |

## Recommendation Engine (V1)

Deterministic scoring per zone:

```
score = historical_hourly_revenue × 0.7 + recent_ride_count × 0.2 + weather_bonus × 0.1
```

## Background Jobs

| Interval | Job |
|----------|-----|
| 15 min | Weather sync |
| 5 min | Recommendation refresh |
| Nightly (2 AM) | Heatmap cell aggregation |

## Optional API Keys

Add to `backend/.env`:

- `OPENWEATHERMAP_API_KEY` — real weather data
- `OPENROUTESERVICE_API_KEY` — accurate travel times (falls back to distance estimate)

## Zones (Călărași)

City Center, Train Station, Hospital, Market Area, Industrial Area, West/East/South/North Residential.
