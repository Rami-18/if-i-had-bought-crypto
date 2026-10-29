# If I Had Bought Crypto Calculator

A beginner-friendly hypothetical cryptocurrency investment calculator built with React + Vite and Flask. Demo prices are clearly labelled; live CoinGecko data can be configured in the backend.

## Requirements
- Python 3.10+
- Node.js 18+

## Run backend (Windows)
```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```
Backend: http://127.0.0.1:5000

## Run frontend (second terminal)
```powershell
cd frontend
npm install
npm run dev
```
Open the URL printed by Vite, usually http://localhost:5173.

## Tests
Backend: `cd backend && pytest`
Frontend: `cd frontend && npm test`

## Live prices
Set `COINGECKO_DEMO_API_KEY` in your environment if your CoinGecko API plan requires it. If no live API key/data is available, the app clearly uses labelled demo prices. Never treat demo values as market quotes.

## Disclaimer
This calculator is hypothetical, excludes taxes and any unconfigured costs, and does not guarantee investment performance.
