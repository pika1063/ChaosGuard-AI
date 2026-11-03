import pytest
from pathlib import Path
from fastapi.testclient import TestClient
pytestmark=pytest.mark.skipif(not Path('models/model.joblib').exists(),reason='train first')
from app.main import app
c=TestClient(app)
def test_health_and_features():
    assert c.get('/health').status_code==200
    assert len(c.get('/features').json()['features'])>0
def test_predict_ok_and_invalid():
    f={k:1.0 for k in c.get('/features').json()['features']}
    d=c.post('/predict',json={'features':f}).json()
    assert d['prediction'] in('BENIGN','ATTACK') and 0<=d['confidence']<=1
    assert c.post('/predict',json={'features':{'x':1}}).status_code==422
def test_chaos_disabled_by_default():assert c.post('/sim/fail').status_code==403
