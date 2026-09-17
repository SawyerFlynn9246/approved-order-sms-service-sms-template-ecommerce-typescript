import { z } from "zod";
import { renderApprovedSms } from "./approved_sms_catalog.js";
import { createInfraiSms } from "./infrai_sms.js";

const orderId = z.string().trim().min(1).max(64);
const phone = z.string().regex(/^\+[1-9]\d{7,14}$/);

export const orderUpdateSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("checkout_confirmed"), orderId, phone, total: z.string().trim().min(1).max(32) }).strict(),
  z.object({ kind: z.literal("fulfillment_shipped"), orderId, phone, trackingCode: z.string().trim().min(1).max(80) }).strict(),
  z.object({ kind: z.literal("receipt_ready"), orderId, phone, receiptUrl: z.string().url().max(500) }).strict(),
  z.object({ kind: z.literal("order_cancelled"), orderId, phone }).strict(),
]);

export type OrderUpdate = z.infer<typeof orderUpdateSchema>;

export function prepareOrderUpdate(input: OrderUpdate) {
  const values: Record<string, string> = { orderId: input.orderId };
  if (input.kind === "checkout_confirmed") values.total = input.total;
  if (input.kind === "fulfillment_shipped") values.trackingCode = input.trackingCode;
  if (input.kind === "receipt_ready") values.receiptUrl = input.receiptUrl;
  return {
    to: input.phone,
    text: renderApprovedSms(input.kind, values),
    idempotencyKey: `order:${input.orderId}:${input.kind}`,
  };
}

export async function sendOrderUpdate(input: OrderUpdate) {
  const prepared = prepareOrderUpdate(input);
  const infrai = createInfraiSms();
  const delivery = await infrai.sms.batch.send<{ message_id: string }>(
    [{ to: prepared.to, text: prepared.text }],
    prepared.idempotencyKey,
  );
  return { orderId: input.orderId, kind: input.kind, messageId: delivery.message_id };
}
