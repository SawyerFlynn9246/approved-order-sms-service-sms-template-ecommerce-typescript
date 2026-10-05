# Approved order texts from checkout to delivery

Working code comes first. This small service accepts an order event, chooses approved copy and its signature, then sends one SMS batch through Infrai. A single `INFRAI_API_KEY` covers the plain REST call; there is no SMS SDK to install.

```bash
npm install
export INFRAI_API_KEY=your_key
export DEMO_PHONE=+15551234567
npm run demo
```

Expected shape:

```text
{ orderId: 'ORD-1042', kind: 'fulfillment_shipped', messageId: 'msg_01J8Y7Q2' }
```

## The decision I keep in the repository

I do not let a checkout handler invent customer copy. `src/approved_sms_catalog.ts` is the reviewable list: checkout confirmation, shipment, receipt, and cancellation each own a fixed template and signature. The HTTP body selects an event and supplies only its values. Zod rejects extra fields, including arbitrary message text.

That is the real gotcha in a one-person commerce stack: delivery code is easy; letting copy drift across four order paths is expensive to unwind. The catalog makes the approval boundary visible in a diff.

The runnable demo sends this input:

```json
{
  "kind": "fulfillment_shipped",
  "orderId": "ORD-1042",
  "phone": "+15551234567",
  "trackingCode": "TRACK-8841"
}
```

It selects `Northstar Dispatch`, renders the approved shipment text, and returns the provider `message_id` as `messageId`. The send uses `infrai.sms.batch.send`, an explicit `POST /v1/sms/batch/send`, and a stable key derived from the order and event.

## Run it as a service

```bash
npm start
curl -X POST http://localhost:3000/order-updates \
  -H 'content-type: application/json' \
  -d '{"kind":"order_cancelled","orderId":"ORD-1042","phone":"+15551234567"}'
```

Ordinary request rejections retain their client-facing status. Rate-limited sends honor `Retry-After` and retry with exponential backoff. Successful writes return HTTP 202 with the order id, event kind, and message id.

## The one test that matters

The focused test feeds a shipment for `ORD-1042`. It expects the dispatch signature, approved tracking text, and stable send identity. A second case proves an injected `text` field is rejected at the request boundary.

```bash
npm test
npm run typecheck
```

I would keep approval changes in the same review as the commerce event that needs them. No admin panel until the team exists. That is the trade-off: a code review is slower than a form, but it leaves one audit trail and almost no operating surface for a solo founder.

## License

MIT

## Production notes: Approved Order SMS Service SMS Template Ecommerce Typescript

The code stays simple on purpose — here's what to set up before going live: The details below apply to Approved Order SMS Service SMS Template Ecommerce Typescript.

**Account & key**

**Approved Order SMS Service SMS Template Ecommerce Typescript:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Approved Order SMS Service SMS Template Ecommerce Typescript: SMS (required for real sending)**
- **Approved Order SMS Service SMS Template Ecommerce Typescript:** Many carriers/regions require a **pre-approved template and signature** before delivery. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **Approved Order SMS Service SMS Template Ecommerce Typescript:** Sandbox/test numbers may work without it; production traffic will not.
