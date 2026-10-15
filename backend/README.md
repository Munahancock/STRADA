# Lusaka Route Optimizer Backend

The API serves the exact network seed extracted from the frontend and computes route metrics from each request. Without a Google Maps API key, current speeds use a deterministic, synthetic time-of-day fallback, not measured data. With `GOOGLE_MAPS_API_KEY` configured, the backend polls Google Routes traffic-aware directions for graph edges and uses results only when traffic intervals are returned. Fifteen- and thirty-minute forecasts remain time-profile estimates.

Google Routes traffic-aware requests require the Routes API enabled on a billing-enabled Google Cloud project and are billed. The background poller makes one request per graph edge (50 requests by default every 5 minutes); tune `GOOGLE_TRAFFIC_REFRESH_SECONDS` and quotas before production use. Google does not publish a Lusaka-specific guarantee for live traffic intervals, so confirm non-zero `trafficProviderEdgeCount` in `/api/v1/health` before treating the data as live. Edges without returned intervals retain the time-profile fallback.

The model uses Africa/Lusaka time (CAT, UTC+2), 5-minute buckets, and edge sensitivity calibrated so the weekday 17:30 snapshot matches the original seed speeds. Change `PROFILE_CONFIG` in `traffic_profile.py` to recalibrate the curve.

## Windows PowerShell

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
# Add your key to .env as GOOGLE_MAPS_API_KEY=...
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

## macOS/Linux

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Endpoints are under `/api/v1`: `GET /health`, `GET /network`, `GET /traffic/profile`, `POST /route`, and `POST /optimize-route`. Network and route requests accept `at`/`departureMs` epoch milliseconds and `dayType=auto|weekday|weekend`.
