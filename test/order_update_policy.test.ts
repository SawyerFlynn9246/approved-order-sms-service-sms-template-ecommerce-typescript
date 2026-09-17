import assert from "node:assert/strict";
import test from "node:test";
import { orderUpdateSchema, prepareOrderUpdate } from "../src/order_update_service.js";

test("a shipment uses the approved dispatch signature and stable send identity", () => {
  const update = orderUpdateSchema.parse({
    kind: "fulfillment_shipped",
    orderId: "ORD-1042",
    phone: "+15551234567",
    trackingCode: "TRACK-8841",
  });
  assert.deepEqual(prepareOrderUpdate(update), {
    to: "+15551234567",
    text: "[Northstar Dispatch] Order ORD-1042 shipped. Tracking: TRACK-8841.",
    idempotencyKey: "order:ORD-1042:fulfillment_shipped",
  });
});

test("an arbitrary message body cannot cross the request boundary", () => {
  const parsed = orderUpdateSchema.safeParse({
    kind: "fulfillment_shipped",
    orderId: "ORD-1042",
    phone: "+15551234567",
    trackingCode: "TRACK-8841",
    text: "Unapproved copy",
  });
  assert.equal(parsed.success, false);
});
