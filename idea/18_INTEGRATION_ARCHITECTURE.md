# 18 — EXTERNAL INTEGRATION ARCHITECTURE

## SmartProcure: External API Isolation, Adapter Boundaries, and Mock Specifications

---

## 1. External Integration Isolation Philosophy

> **CRITICAL ARCHITECTURAL MANDATE**:
>
> 1. Business domain modules (`procurements`, `payments`, `farmers`, `recommendations`) **MUST NEVER** make direct HTTP/RPC calls to external vendor APIs.
> 2. All third-party systems are hidden behind **Abstract Integration Interfaces** (`IPaymentAdapter`, `ISmsAdapter`, `IMapsAdapter`, `IIdentityAdapter`).
> 3. Development, Testing, and Initial Phase 2 staging environments **MUST USE MOCK ADAPTERS BY DEFAULT**.
> 4. **No government or banking integration API is assumed to be available** unless explicitly authorized with credentials. All external APIs operate as stubs until Phase 3+.

---

## 2. Integration Boundary Directory

```
backend/src/integrations/
├── sms/
│   ├── smsAdapter.interface.js    # ISmsAdapter contract
│   ├── mockSms.adapter.js         # Console log & file logger mock (DEFAULT)
│   └── twilioSms.adapter.js       # Production Twilio SDK adapter
├── email/
│   ├── emailAdapter.interface.js  # IEmailAdapter contract
│   ├── mockEmail.adapter.js       # Ethereal SMTP / Local JSON logger (DEFAULT)
│   └── sesEmail.adapter.js        # Production AWS SES adapter
├── payment/
│   ├── paymentAdapter.interface.js# IPaymentAdapter contract
│   ├── mockPayment.adapter.js     # Simulated instant success/fail stub (DEFAULT)
│   └── dbtBank.adapter.js         # Production Direct Benefit Transfer API adapter
├── maps/
│   ├── mapsAdapter.interface.js   # IMapsAdapter contract
│   ├── haversineMaps.adapter.js   # Pure math straight-line calculation (DEFAULT - Zero Cost)
│   └── googleMaps.adapter.js      # Production Google Maps Distance Matrix adapter
├── identity/
│   ├── identityAdapter.interface.js# IIdentityAdapter contract
│   └── mockIdentity.adapter.js    # Manual admin review verification mock (DEFAULT)
└── storage/
    ├── storageAdapter.interface.js# IStorageAdapter contract
    ├── localStorage.adapter.js    # Local disk storage mock (DEFAULT for dev)
    └── s3Storage.adapter.js       # Production AWS S3 / MinIO adapter
```

---

## 3. Mock Adapter Specifications

### 3.1 Payment Gateway Mock (`integrations/payment/mockPayment.adapter.js`)

- **Behavior**: Simulates async bank disbursement processing.
- When `initiatePayment()` is called in dev/staging environment, the mock generates a fake bank UTR (`UTR-MOCK-992182`) and returns `STATUS: INITIATED`.
- After a 5-second simulated delay (via BullMQ worker), it triggers a mock inbound webhook call to `POST /api/v1/payments/webhook`, transitioning the payment to `COMPLETED`.

### 3.2 Maps Geolocation Mock (`integrations/maps/haversineMaps.adapter.js`)

- **Behavior**: Requires **ZERO** external API calls and incurs **ZERO** cost.
- Computes distance between farmer coordinates $(Lat_F, Long_F)$ and centre coordinates $(Lat_C, Long_C)$ using the spherical Haversine formula:

$$d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$

- Provides 95%+ accuracy for rural centre recommendation filtering without third-party mapping SDK dependencies.

---

## 4. Inbound Webhook Security Pattern

For external callbacks (e.g., payment completion webhooks from banks/payment gateways):

```javascript
// Example Middleware: Verify Payment Webhook HMAC Signature (middleware/verifyWebhookHmac.js)
import crypto from "crypto";

export const verifyPaymentWebhookSignature = (req, res, next) => {
  const signatureHeader = req.headers["x-signature"];
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;

  if (!signatureHeader || !secret) {
    return res.status(401).json({
      success: false,
      error: { message: "Missing webhook signature" },
    });
  }

  const computedHmac = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (
    crypto.timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(computedHmac),
    )
  ) {
    return next();
  }

  return res
    .status(403)
    .json({ success: false, error: { message: "Invalid webhook signature" } });
};
```

---

_Document Version: 1.0 | Phase: 2 — Architecture | Status: Approved Blueprint_
