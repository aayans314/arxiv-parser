import urllib.request
import json
req = urllib.request.Request('http://localhost:8000/api/extract',
    data=b'{"url":"https://arxiv.org/abs/1005.3196"}',
    headers={'Content-Type': 'application/json'}
)
try:
    res = urllib.request.urlopen(req)
    data = json.loads(res.read())
    print("KEYS:", data.keys())
    print("success:", data.get('success'))
    print("data items:", len(data.get('data', [])))
    print("failures items:", len(data.get('failures', [])))
    print("data type:", type(data.get('data')))
except Exception as e:
    print("Error:", e)
