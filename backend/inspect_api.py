import requests
import json

try:
    print("Fetching Leaderboard...")
    r = requests.get("http://localhost:5000/api/leaderboard/top10")
    print(f"Status Code: {r.status_code}")
    print("Raw Response:")
    print(r.text)
    
    data = r.json()
    print("\nParsed JSON:")
    print(json.dumps(data, indent=2))
except Exception as e:
    print(f"Error: {e}")
