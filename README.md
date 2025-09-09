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

## Run local with LocalStack
```bash
docker compose up -d
pip install awscli-local
```

### Build Typescript
```bash
npm install
npm i -D esbuild typescript @types/aws-lambda
npx esbuild lambda_get/src/index.ts --bundle --platform=node --target=node20 --format=cjs --outfile=lambda_get/dist/index.js
npx esbuild lambda_post/src/index.ts --bundle --platform=node --target=node20 --format=cjs --outfile=lambda_post/dist/index.js
```
### ZIp the bundles
```bash
mkdir -p build
(cd lambda_get/dist  && zip -qr ../../build/get.zip  .)
(cd lambda_post/dist && zip -qr ../../build/post.zip .)
```

### Create lambda functions:
```
ROLE_ARN="arn:aws:iam::000000000000:role/flights-demo-lambda-exec"

awslocal lambda create-function \
  --function-name flights-demo-get-flights \
  --runtime nodejs20.x --handler index.handler \
  --zip-file fileb://build/get.zip --role "$ROLE_ARN"

awslocal lambda create-function \
  --function-name flights-demo-post-booking \
  --runtime nodejs20.x --handler index.handler \
  --zip-file fileb://build/post.zip --role "$ROLE_ARN"
```

### Expose functions URLs 
```bash
# (Optional) deterministic subdomain
awslocal lambda tag-resource --resource "arn:aws:lambda:us-east-1:000000000000:function:flights-demo-get-flights" \
  --tags _custom_id_=get-flights
awslocal lambda tag-resource --resource "arn:aws:lambda:us-east-1:000000000000:function:flights-demo-post-booking" \
  --tags _custom_id_=post-booking

awslocal lambda create-function-url-config --function-name flights-demo-get-flights  --auth-type NONE
awslocal lambda create-function-url-config --function-name flights-demo-post-booking --auth-type NONE

awslocal lambda add-permission --function-name flights-demo-get-flights \
  --statement-id AllowPublicGET --action lambda:InvokeFunctionUrl --principal "*" --function-url-auth-type NONE
awslocal lambda add-permission --function-name flights-demo-post-booking \
  --statement-id AllowPublicPOST --action lambda:InvokeFunctionUrl --principal "*" --function-url-auth-type NONE
```

### Get the URLs
```bash
GET_URL=$(awslocal lambda get-function-url-config --function-name flights-demo-get-flights --query FunctionUrl --output text)
POST_URL=$(awslocal lambda get-function-url-config --function-name flights-demo-post-booking --query FunctionUrl --output text)
echo "$GET_URL"
echo "$POST_URL"
```

### Call urls
```bash
# A) Host header (no DNS needed)
curl -sS -H "Host: $(echo "$GET_URL" | sed -E 's#^http://([^/]+)/.*#\1#')" "http://localhost:4566/flights" | jq .

curl -sS \
  -H "Host: $(echo "$POST_URL" | sed -E 's#^http://([^/]+)/.*#\1#')" \
  -H "Content-Type: application/json" \
  -X POST "http://localhost:4566/bookings" \
  -d '{"flight_id":"F1001","passenger":{"first_name":"Ada","last_name":"Lovelace","email":"ada@example.com"}}'
```

