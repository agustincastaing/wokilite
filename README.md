# WokiLite – Restaurant Reservation System

**Stack:**  
Node.js · TypeScript · Express · Zod · Luxon · Pino · Vitest · React · Material UI

---

## How to Run

### Backend

```sh
cd wokilite/api
npm install
npm run dev
```
Server will be available at: [http://localhost:3000](http://localhost:3000)
Server is currently hosted at [https://wokilite-358s.onrender.com/health](https://wokilite-358s.onrender.com/health)

### Frontend

```sh
cd wokilite-frontend
npm install
npm run dev
```
UI will be available at: [http://localhost:5173/floor-plan](http://localhost:5173/floor-plan)

### Tests

```sh
npm run test
```

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


## Considerations: 

The current implementation uses client-side idempotency key generation for simplicity. In production, I would:

1. Use server-generated idempotency keys **OR**
2. Implement database-level uniqueness constraints on  
   `(restaurantId, sectorId, customerEmail, startDateTime)`
3. Add idempotency key expiration (currently keys persist forever)
4. Consider using a proper idempotency library (e.g., [idempotent-request](https://github.com/ahmadnassri/node-idempotent-request))

**The current approach works for the demo but has limitations:**

- Keys persist indefinitely (can lead to a memory leak in a long-running app)
- Clients can manipulate keys (doesn't break security, but not ideal)
- Requires client-side hashing logic

## Duplicate Prevention

The system prevents duplicate reservations at two levels:

1. **Idempotency Key**: Prevents duplicate requests (network retries)
2. **Customer+Time Check**: Prevents the same customer from booking 
   multiple reservations at the same restaurant/time, even with 
   different idempotency keys

This business rule assumes one customer = one reservation per time slot.


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

