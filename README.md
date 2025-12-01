WokiLite – Restaurant Reservation System
Stack: Node.js + TypeScript + Express + Zod + Luxon + Pino + Vitest

---

How to Run:

Back
cd wokilite/api
npm install
npm run dev
Server runs on http://localhost:3000

Front
npm install
npm run dev
http://localhost:5173/floor-plan
---
Endpoints

# Health check
GET    /health

# List all restaurants
GET    /restaurants

# Get restaurant by id
GET    /restaurants/:id

# Availability
GET    /availability?restaurantId=R1&sectorId=S1&date=2025-09-08&partySize=4
a
# Create reservation
POST   /reservations
Header: Idempotency-Key: any-unique-string
Body:   { restaurantId, sectorId, partySize, startDateTimeISO, customer: {name,phone,email}, notes? }

# Cancel
DELETE /reservations/:id

# List day
GET    /reservations/day?restaurantId=R1&date=2025-09-08[&sectorId=S1]

# Get floor plan availability
GET    /availability/floor-plan?restaurantId=R1&sectorId=S1[&dateTime=2025-09-08T19:00:00][&time=19:00]

---
NOTES
Used Grok AI to create test cases

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
