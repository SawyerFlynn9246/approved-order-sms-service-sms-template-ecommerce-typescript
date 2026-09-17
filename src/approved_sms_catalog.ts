export const approvedSmsCatalog = {
  checkout_confirmed: {
    signature: "Northstar Shop",
    template: "Order {{orderId}} is confirmed. Total: {{total}}.",
  },
  fulfillment_shipped: {
    signature: "Northstar Dispatch",
    template: "Order {{orderId}} shipped. Tracking: {{trackingCode}}.",
  },
  receipt_ready: {
    signature: "Northstar Shop",
    template: "Receipt for order {{orderId}}: {{receiptUrl}}.",
  },
  order_cancelled: {
    signature: "Northstar Care",
    template: "Order {{orderId}} was cancelled. No further action is needed.",
  },
} as const;

export type OrderUpdateKind = keyof typeof approvedSmsCatalog;

export function renderApprovedSms(
  kind: OrderUpdateKind,
  values: Record<string, string>,
): string {
  const approved = approvedSmsCatalog[kind];
  const body = approved.template.replace(/\{\{([A-Za-z]+)\}\}/g, (_, key: string) => {
    const value = values[key];
    if (!value) throw new Error(`Missing template value: ${key}`);
    return value;
  });
  return `[${approved.signature}] ${body}`;
}
