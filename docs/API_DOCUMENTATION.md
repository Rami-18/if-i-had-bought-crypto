# API Documentation

Base URL: `http://127.0.0.1:5000`

- `GET /api/health` — health check.
- `GET /api/coins` — supported coins.
- `GET /api/prices/current/<coin_id>` — current demo quote.
- `POST /api/calculate` — JSON body: `coin_id`, `purchase_date` (`YYYY-MM-DD`), `amount`, `currency`.
- `GET /api/history` — saved calculations.
- `POST /api/history` — save a calculation result.
- `DELETE /api/history/<id>` — delete one saved calculation.

Errors return a JSON object with an `error` message.
