import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

type Flight = {
  id: string;
  from: string;
  to: string;
  date: string;      // YYYY-MM-DD
  price: number;
  currency: string;
  airline: string;
};

const FLIGHTS: Flight[] = [
  { id: "F1001", from: "ARN", to: "LHR", date: "2025-09-15", price: 120.0, currency: "EUR", airline: "SK" },
  { id: "F1002", from: "ARN", to: "LHR", date: "2025-09-16", price: 135.0, currency: "EUR", airline: "BA" },
  { id: "F2001", from: "ARN", to: "CDG", date: "2025-09-15", price: 110.0, currency: "EUR", airline: "AF" },
  { id: "F3001", from: "ARN", to: "JFK", date: "2025-09-20", price: 420.0, currency: "EUR", airline: "SK" }
];

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const qs = event.queryStringParameters ?? {};
  const from = qs.from?.toUpperCase();
  const to = qs.to?.toUpperCase();
  const date = qs.date;

  const matches = (f: Flight) =>
    (!from || f.from === from) &&
    (!to   || f.to   === to) &&
    (!date || f.date === date);

  const results = FLIGHTS.filter(matches);

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ flights: results, count: results.length })
  };
};
