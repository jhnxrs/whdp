# How to Run the Application

## API Setup

### 1. Install dependencies
Start by installing all dependencies:

```bash
pnpm install
```

### 2. Environment variables
Add the proper \`FIREBASE_SERVICE_ACCOUNT_JSON\` to your \`.env\` file.

### 3. Seed mock / test data
Next, set up some mock testing data:

1. Run the seed script:
   ```bash
   pnpm run:seed
   ```

2. Open \`scripts/RunMockedIngestion.ts\` and update the \`userId\` with the ID of the user created by the seed script.

3. Run the mocked ingestion:
   ```bash
   pnpm run:ingestion
   ```

> If needed, you can reset everything by running:
>
> ```bash
> pnpm run:clear
> ```
>
> This will clear both the Firestore database and all authentication users.

### 4. Run the API
Once the steps above are completed, start the API in development mode:

```bash
pnpm run dev
```

At this point, you should have mocked Dexcom and Apple Health data properly stored in the database.

You can now start hitting the API endpoints using the \`x-user-id\` header, passing the seeded user ID (development mode only).

---

## Client Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Start the client:
   ```bash
   pnpm run dev
   ```

3. Sign in using the seeded account:
   - **Email:** \`test.user@gmail.com\`
   - **Password:** \`123123123\`

Once logged in, the dashboard will display an example chart based on the mocked data.

---

## Application Structure

The application is built using the **Domain-Driven Design (DDD)** pattern and is divided into three main layers:

- **Domain layer**  
  Contains entities and business rules.

- **Application layer**  
  Contains use cases and orchestration logic.

- **Infrastructure layer**  
  Handles database connections, repositories, HTTP adapters, caching, etc.

For this take-home test, the ingestion endpoint is assumed to be used only internally (e.g., an internal ingestion pipeline). In a real-world project, this would require OAuth flows and stricter input validation.

Some inputs accepted by the ingestion endpoint would not be exposed to end users in production, but they are sufficient for the scope of this exercise.

---

## Data Flow Overview

The ingestion pipeline follows this flow:

```
Vendor Payload
  → Normalize
    → Apply Metric Rules
      → Process (streams & observations)
        → Persist to database
```

---

## Modeling Decisions

### Observations
Observations are stored using the following structure:

```
streams/<streamId>/days/<YYYYMMDD>/observations/<observationId>
```

This structure makes it easy to:
- Query data by date
- Keep observations well-partitioned
- Scale efficiently as the number of observations grows

### Rollups
Rollups are generated during observation and stream processing. In a real-world system, this logic would ideally live in a background job or a Cloud Function trigger.

Rollups are stored as:

```
streams/<streamId>/rollups/<YYYYMMDD>
```

This allows for:
- Fast retrieval of aggregated data
- Simple date-based queries
- Clear separation between raw observations and aggregated metrics

---

## Final Notes

This structure was designed with scalability, clarity, and query efficiency in mind. Grouping data by stream and date allows the system to handle large volumes of time-series data while keeping reads predictable and performant.