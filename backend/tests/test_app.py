import os
import sys
import tempfile
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
import app as crypto_app

def setup_function():
    fd, path = tempfile.mkstemp(suffix='.db')
    os.close(fd)
    crypto_app.DB_PATH = path

def teardown_function():
    try:
        os.remove(crypto_app.DB_PATH)
    except OSError:
        pass

def test_health():
    assert crypto_app.app.test_client().get('/api/health').status_code == 200

def test_calculate_positive_or_negative_result():
    client = crypto_app.app.test_client()
    response = client.post('/api/calculate', json={
        'coin_id': 'bitcoin', 'purchase_date': '2024-01-01', 'amount': 100, 'currency': 'USD'
    })
    assert response.status_code == 200
    assert 'return_pct' in response.get_json()

def test_reject_zero_amount():
    response = crypto_app.app.test_client().post('/api/calculate', json={
        'coin_id': 'bitcoin', 'purchase_date': '2024-01-01', 'amount': 0, 'currency': 'USD'
    })
    assert response.status_code == 400

def test_reject_future_date():
    from datetime import date, timedelta
    future = (date.today() + timedelta(days=1)).isoformat()
    response = crypto_app.app.test_client().post('/api/calculate', json={
        'coin_id': 'bitcoin', 'purchase_date': future, 'amount': 100, 'currency': 'USD'
    })
    assert response.status_code == 400
