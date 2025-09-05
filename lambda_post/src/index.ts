import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { randomUUID } from "node:crypto";

type Passenger = {
  first_name?: string;
  last_name?: string;
  email?: string;
};

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  let bodyText = event.body ?? "{}";
  if (event.isBase64Encoded) {
    bodyText = Buffer.from(bodyText, "base64").toString("utf-8");
  }

  let payload: any;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return resp(400, { error: "Invalid JSON body" });
  }

  const flight_id = payload?.flight_id as string | undefined;
  const passenger = (payload?.passenger ?? {}) as Passenger;

  if (!flight_id) {
    return resp(400, { error: "flight_id is required" });
  }

  const booking = {
    booking_id: `BK-${randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase()}`,
    flight_id,
    passenger: {
      first_name: passenger.first_name ?? "John",
      last_name:  passenger.last_name  ?? "Doe",
      email:      passenger.email      ?? "john.doe@example.com"
    },
    status: "CONFIRMED",
    created_at: new Date().toISOString()
  };

  return resp(201, booking);
};

function resp(code: number, body: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode: code,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}
