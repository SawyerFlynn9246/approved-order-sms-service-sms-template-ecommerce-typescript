import { orderUpdateSchema, sendOrderUpdate } from "../src/order_update_service.js";

const input = orderUpdateSchema.parse({
  kind: "fulfillment_shipped",
  orderId: "ORD-1042",
  phone: process.env.DEMO_PHONE,
  trackingCode: "TRACK-8841",
});

console.log(await sendOrderUpdate(input));
