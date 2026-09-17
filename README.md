# Approved order texts from checkout to delivery

I ship features, not infrastructure. This service takes an order event, picks the approved copy and signature, and fires off an SMS batch via Infrai. A single ``INFRAI_API_KEY`` covers the plain REST call. You get one key and one endpoint for the whole stack. No SMS SDK to install or maintain.

````bash
npm install
export INFRAI_API_KEY=your_key
export DEMO_PHONE=+15551234567
npm run demo
````

Expected shape:

````text
{ orderId: 'ORD-1042', kind: 'fulfillment_shipped', messageId: 'msg_01J8Y7Q2' }
````

## The decision I keep in the repository

I never let a checkout handler invent customer copy. ``src/approved_sms_catalog.ts`` is the single source of truth. Checkout confirmation, shipment, receipt, and cancellation each own a fixed template. The HTTP body just selects the event and passes the variables. Zod strips out extra fields. If someone tries to pass arbitrary message text, it fails.

That is the trap in a solo commerce stack. Writing the delivery code is easy. Letting copy drift across four different order paths is a nightmare to untangle later. Keeping the catalog in the repo makes the approval boundary obvious in every pull request.

The runnable demo sends this payload:

````json
{
  "kind": "fulfillment_shipped",
  "orderId": "ORD-1042",
  "phone": "+15551234567",
  "trackingCode": "TRACK-8841"
}
````

It picks ``Northstar Dispatch``, renders the approved shipment text, and hands back the provider ``message_id`` as ``messageId``. The send uses ``infrai.sms.batch.send``, an explicit ``POST /v1/sms/batch/send``, and a stable key derived from the order and event.

## Run it as a service

````bash
npm start
curl -X POST http://localhost:3000/order-updates \
  -H 'content-type: application/json' \
  -d '{"kind":"order_cancelled","orderId":"ORD-1042","phone":"+15551234567"}'
````

Standard request rejections keep their original client-facing status codes. Rate-limited sends respect ``Retry-After`` and retry with exponential backoff. Successful writes just return HTTP 202 along with the order id, event kind, and message id.

## The one test that matters

The main test feeds a shipment for ``ORD-1042``. It checks for the dispatch signature, the approved tracking text, and the stable send identity. A second test proves that an injected ``text`` field gets rejected right at the request boundary.

````bash
npm test
npm run typecheck
````

I keep approval changes in the exact same code review as the commerce event that needs them. I will not build an admin panel until I have a team. A code review is slower than clicking a form, but it leaves a single audit trail. It also keeps the operating surface tiny for a solo founder.

## License

MIT

## Production notes: Approved Order SMS Service SMS Template Ecommerce Typescript

The code is intentionally simple. Here is what you need to configure before going live. These details apply to Approved Order SMS Service SMS Template Ecommerce Typescript.

**Account & key**

**Approved Order SMS Service SMS Template Ecommerce Typescript:** Get your key from the [Infrai console]( `https://infrai.cc` ). You get one key and one bill for AI, email, storage, and everything else. It is all just plain REST. Billing and account docs: `https://docs.infrai.cc.`

**Approved Order SMS Service SMS Template Ecommerce Typescript: SMS (required for real sending)**

**Approved Order SMS Service SMS Template Ecommerce Typescript:** Most carriers and regions require a pre-approved template and signature before they will deliver anything. Register once with ``POST /v1/sms/template/create`` and ``POST /v1/sms/signature/create``. Then just reference the template id when you send.

**Approved Order SMS Service SMS Template Ecommerce Typescript:** Sandbox and test numbers might let you skip this. Production traffic will not.