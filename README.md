# WokiLite – Restaurant Reservation System

**Stack:**  
Node.js · TypeScript · Express · Zod · Luxon · Pino · Vitest

---

## How to Run

### Backend

```sh
cd wokilite/api
npm install
npm run dev
```
Server will be available at: [http://localhost:3000](http://localhost:3000)

### Frontend

```sh
npm install
npm run dev
```
UI will be available at: [http://localhost:5173/floor-plan](http://localhost:5173/floor-plan)

---

## API Endpoints

### Health Check
```
GET /health
```

### List All Restaurants
```
GET /restaurants
```

### Get Restaurant by ID
```
GET /restaurants/:id
```

### Check Availability
```
GET /availability?restaurantId=R1&sectorId=S1&date=2025-09-08&partySize=4
```

### Create Reservation
```
POST /reservations
Headers:
  Idempotency-Key: <any-unique-string>
Body (JSON):
  {
    "restaurantId": "...",
    "sectorId": "...",
    "partySize": ...,
    "startDateTimeISO": "...",
    "customer": {
      "name": "...",
      "phone": "...",
      "email": "..."
    },
    "notes": "..."
  }
```

### Cancel Reservation
```
DELETE /reservations/:id
```

### List Reservations By Day
```
GET /reservations/day?restaurantId=R1&date=2025-09-08[&sectorId=S1]
```

### Get Floor Plan Availability
```
GET /availability/floor-plan?restaurantId=R1&sectorId=S1[&dateTime=2025-09-08T19:00:00][&time=19:00]
```

---

## Notes

- Test cases were created using Grok AI.

<details>
<summary>Project Structure</summary>

```text
.
├── api
│   ├── src
│   │   ├── routes
│   │   │   ├── availability.ts
│   │   │   ├── reservations.ts
│   │   │   └── restaurants.ts
│   │   ├── services
│   │   │   ├── availability.ts
│   │   │   └── reservation.ts
│   │   ├── utils
│   │   │   └── time.ts
│   │   ├── data.ts
│   │   ├── models.ts
│   │   └── server.ts
│   ├── tests
│   │   └── reservation.core.test.ts
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
│
├── wokilite-frontend
│   ├── public
│   │   └── vite.svg
│   ├── src
│   │   ├── api
│   │   │   └── client.ts
│   │   ├── assets
│   │   │   └── react.svg
│   │   ├── components
│   │   │   ├── floorplan.tsx
│   │   │   └── layout.tsx
│   │   ├── entities
│   │   │   └── restaurant.entity.ts
│   │   ├── pages
│   │   │   ├── home.tsx
│   │   │   └── reservations.tsx
│   │   ├── utils
│   │   │   └── idempotency.ts
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── main.tsx
│   │   └── theme.ts
│   ├── .env.local
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
└── README.md
```
</details>

