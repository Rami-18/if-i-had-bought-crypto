from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import date, datetime, timezone
import sqlite3, os, requests

ROOT = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(ROOT, '..', 'instance', 'history.db')
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

COINS = [
    {"id": "bitcoin", "name": "Bitcoin", "symbol": "BTC", "demo_price": 68000},
    {"id": "ethereum", "name": "Ethereum", "symbol": "ETH", "demo_price": 2500},
    {"id": "solana", "name": "Solana", "symbol": "SOL", "demo_price": 155},
    {"id": "ripple", "name": "XRP", "symbol": "XRP", "demo_price": 0.52},
    {"id": "dogecoin", "name": "Dogecoin", "symbol": "DOGE", "demo_price": 0.14},
]

def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute('''CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY AUTOINCREMENT, coin_id TEXT NOT NULL, symbol TEXT NOT NULL,
        purchase_date TEXT NOT NULL, amount REAL NOT NULL, currency TEXT NOT NULL,
        historical_price REAL NOT NULL, current_price REAL NOT NULL, quantity REAL NOT NULL,
        current_value REAL NOT NULL, profit_loss REAL NOT NULL, return_pct REAL NOT NULL,
        source TEXT NOT NULL, created_at TEXT NOT NULL)''')
    conn.commit()
    return conn

def price_data(coin_id, purchase_date):
    coin = next((c for c in COINS if c['id'] == coin_id), None)
    if not coin:
        raise ValueError("Unsupported cryptocurrency.")
    # Live API is used when configured and reachable; otherwise labelled demo data.
    api_key = os.getenv("COINGECKO_DEMO_API_KEY", "")
    if api_key:
        headers = {"x-cg-demo-api-key": api_key}
        try:
            current = requests.get(
                f"https://api.coingecko.com/api/v3/simple/price?ids={coin_id}&vs_currencies=usd",
                headers=headers, timeout=8).json()
            hist = requests.get(
                f"https://api.coingecko.com/api/v3/coins/{coin_id}/history?date={datetime.strptime(purchase_date, '%Y-%m-%d').strftime('%d-%m-%Y')}&localization=false",
                headers=headers, timeout=8).json()
            current_price = current[coin_id]['usd']
            historical_price = hist['market_data']['current_price']['usd']
            return historical_price, current_price, "CoinGecko live API (USD)"
        except Exception:
            pass
    # Deterministic demo data, explicitly identified as not market data.
    days = (date.today() - datetime.fromisoformat(purchase_date).date()).days
    historical = coin['demo_price'] * (0.65 if days > 365 else 0.9 if days > 30 else 1.0)
    return historical, coin['demo_price'], "DEMO DATA — illustrative only"

app = Flask(__name__)
CORS(app)

@app.get('/api/health')
def health():
    return jsonify({"status": "ok"})

@app.get('/api/coins')
def coins():
    return jsonify([{"id": c["id"], "name": c["name"], "symbol": c["symbol"]} for c in COINS])

@app.get('/api/prices/current/<coin_id>')
def current_price(coin_id):
    coin = next((c for c in COINS if c['id'] == coin_id), None)
    if not coin:
        return jsonify({"error": "Unsupported cryptocurrency"}), 404
    return jsonify({"coin": coin_id, "price": coin["demo_price"], "currency": "USD",
                    "source": "DEMO DATA — illustrative only",
                    "updated_at": datetime.now(timezone.utc).isoformat()})

@app.post('/api/calculate')
def calculate():
    data = request.get_json(silent=True) or {}
    try:
        coin_id = str(data.get('coin_id', 'bitcoin'))
        purchase_date = str(data.get('purchase_date', ''))
        amount = float(data.get('amount', 0))
        currency = str(data.get('currency', 'USD')).upper()
        if currency not in {'USD', 'INR', 'EUR', 'GBP'}:
            raise ValueError("Choose INR, USD, EUR, or GBP.")
        if amount <= 0:
            raise ValueError("Investment amount must be greater than zero.")
        selected_date = date.fromisoformat(purchase_date)
        if selected_date > date.today():
            raise ValueError("Purchase date cannot be in the future.")
        if selected_date == date.today():
            raise ValueError("Choose a date before today to calculate a historical investment.")
        # Demo prices are denominated in USD. Conversion values are illustrative only.
        rates = {"USD": 1.0, "INR": 83.0, "EUR": 0.92, "GBP": 0.79}
        historical_usd, current_usd, source = price_data(coin_id, purchase_date)
        historical = historical_usd * rates[currency]
        current = current_usd * rates[currency]
        quantity = amount / historical
        current_value = quantity * current
        profit = current_value - amount
        result = {
            "coin_id": coin_id, "purchase_date": purchase_date, "amount": amount,
            "currency": currency, "historical_price": historical, "current_price": current,
            "quantity": quantity, "current_value": current_value, "profit_loss": profit,
            "return_pct": profit / amount * 100, "source": source,
            "historical_timestamp": purchase_date, "current_timestamp": datetime.now(timezone.utc).isoformat()
        }
        return jsonify(result)
    except (ValueError, TypeError, KeyError) as exc:
        return jsonify({"error": str(exc) or "Invalid calculation input."}), 400
    except Exception:
        return jsonify({"error": "Unable to calculate with the available price data."}), 502

@app.get('/api/history')
def get_history():
    conn = db()
    rows = [dict(row) for row in conn.execute('SELECT * FROM history ORDER BY id DESC').fetchall()]
    conn.close()
    return jsonify(rows)

@app.post('/api/history')
def save_history():
    data = request.get_json(silent=True) or {}
    required = ['coin_id', 'purchase_date', 'amount', 'currency', 'historical_price',
                'current_price', 'quantity', 'current_value', 'profit_loss', 'return_pct', 'source']
    if any(key not in data for key in required):
        return jsonify({"error": "Calculation result is missing required fields."}), 400
    coin = next((c for c in COINS if c['id'] == data['coin_id']), None)
    if not coin:
        return jsonify({"error": "Unsupported cryptocurrency."}), 400
    conn = db()
    cur = conn.execute('''INSERT INTO history
        (coin_id,symbol,purchase_date,amount,currency,historical_price,current_price,quantity,
         current_value,profit_loss,return_pct,source,created_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)''',
        (data['coin_id'], coin['symbol'], data['purchase_date'], float(data['amount']), data['currency'],
         float(data['historical_price']), float(data['current_price']), float(data['quantity']),
         float(data['current_value']), float(data['profit_loss']), float(data['return_pct']),
         data['source'], datetime.now(timezone.utc).isoformat()))
    conn.commit()
    item_id = cur.lastrowid
    conn.close()
    return jsonify({"id": item_id, "message": "Calculation saved."}), 201

@app.delete('/api/history/<int:item_id>')
def delete_history(item_id):
    conn = db()
    cur = conn.execute('DELETE FROM history WHERE id = ?', (item_id,))
    conn.commit()
    conn.close()
    if cur.rowcount == 0:
        return jsonify({"error": "History item not found."}), 404
    return jsonify({"message": "Deleted."})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
