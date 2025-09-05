# Flights API demo:

This deploys two Lambda functions and exposes them via API Gateway HTTP API:
- `GET /flights` — returns hard-coded flight search results (optional query: `from`, `to`, `date`)
- `POST /bookings` — accepts `{ "flight_id": "...", "passenger": {...} }` and returns a mock confirmation

## Prereqs
- Terraform >= 1.5
- AWS credentials configured (env vars or shared config)
- Node.js 20+
- esbuild

## Deploy
```bash
terraform init
terraform apply -auto-approve
```

On success, Terraform outputs `api_endpoint` (e.g., `https://abc123.execute-api.eu-north-1.amazonaws.com`).

## Try it
```bash
API="<the api_endpoint from outputs>"
curl "$API/flights"
curl "$API/flights?from=ARN&to=LHR&date=2025-09-15"

curl -X POST "$API/bookings"           -H "Content-Type: application/json"           -d '{"flight_id":"F1001","passenger":{"first_name":"Ada","last_name":"Lovelace","email":"ada@example.com"}}'
```

