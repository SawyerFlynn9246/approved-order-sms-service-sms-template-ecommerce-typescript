import { createServer } from "node:http";
import { ZodError } from "zod";
import { InfraiError } from "./infrai_sms.js";
import { orderUpdateSchema, sendOrderUpdate } from "./order_update_service.js";

const port = Number(process.env.PORT ?? 3000);

function readJson(request: import("node:http").IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 32_000) reject(new Error("Request body is too large"));
    });
    request.on("end", () => {
      try { resolve(JSON.parse(raw)); } catch { reject(new Error("Request body must be JSON")); }
    });
    request.on("error", reject);
  });
}

const server = createServer(async (request, response) => {
  response.setHeader("Content-Type", "application/json");
  if (request.method !== "POST" || request.url !== "/order-updates") {
    response.writeHead(404).end(JSON.stringify({ error: "Route not found" }));
    return;
  }
  try {
    const input = orderUpdateSchema.parse(await readJson(request));
    const result = await sendOrderUpdate(input);
    response.writeHead(202).end(JSON.stringify(result));
  } catch (error) {
    if (error instanceof ZodError) {
      response.writeHead(400).end(JSON.stringify({ error: "Invalid order update", issues: error.issues }));
      return;
    }
    if (error instanceof InfraiError) {
      const status = error.status >= 400 && error.status < 500 ? error.status : 502;
      response.writeHead(status).end(JSON.stringify({ error: error.code, message: error.message }));
      return;
    }
    response.writeHead(400).end(JSON.stringify({ error: error instanceof Error ? error.message : "Request rejected" }));
  }
});

server.listen(port, () => console.log(`Order update service listening on http://localhost:${port}`));
