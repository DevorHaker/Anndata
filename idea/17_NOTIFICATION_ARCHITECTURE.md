# 17 — NOTIFICATION ARCHITECTURE

## SmartProcure: Pluggable Multi-Channel Notification Engine & Failover System

---

## 1. Notification Subsystem Architecture

The Notification Subsystem isolates core business logic from third-party communication providers.

```
                           ┌──────────────────────────────────┐
                           │      Internal Domain Event       │
                           └────────────────┬─────────────────┘
                                            │
                                            ▼
                           ┌──────────────────────────────────┐
                           │       NotificationService        │
                           │   (Template Compilation & Log)   │
                           └────────────────┬─────────────────┘
                                            │ Push Job Payload
                                            ▼
                           ┌──────────────────────────────────┐
                           │     BullMQ Worker Queues         │
                           │   (`notifications-high/low`)     │
                           └────────────────┬─────────────────┘
                                            │
         ┌──────────────────────────────────┼──────────────────────────────────┐
         │ SMS Channel                      │ Email Channel                    │ Push / In-App
         ▼                                  ▼                                  ▼
┌──────────────────┐               ┌──────────────────┐               ┌──────────────────┐
│  SmsAdapter      │               │  EmailAdapter    │               │  PushAdapter     │
│  Interface       │               │  Interface       │               │  Interface       │
└────────┬─────────┘               └────────┬─────────┘               └────────┬─────────┘
         │                                  │                                  │
   ┌─────┴─────┐                      ┌─────┴─────┐                      ┌─────┴─────┐
   ▼           ▼                      ▼           ▼                      ▼           ▼
[Twilio]   [MSG91]                 [AWS SES]  [SendGrid]               [FCM]     [Socket.IO]
(Primary)  (Failover)              (Primary)  (Failover)
```

---

## 2. Pluggable Adapter Interfaces

### SMS Adapter Interface (`integrations/sms/smsAdapter.interface.js`)

```javascript
export class ISmsAdapter {
  async sendSMS({ to, message, referenceId }) {
    throw new Error("Method sendSMS() must be implemented");
  }
}
```

### Mock Provider Implementation for Local Dev/Testing (`integrations/sms/mockSms.adapter.js`)

```javascript
import { ISmsAdapter } from "./smsAdapter.interface";
import { pinoLogger } from "../../config/logger";

export class MockSmsAdapter extends ISmsAdapter {
  async sendSMS({ to, message, referenceId }) {
    pinoLogger.info(
      { to, referenceId, message },
      "[MOCK SMS PROVIDER] SMS Dispatched Successfully",
    );
    return {
      success: true,
      messageId: `mock_sms_${crypto.randomUUID()}`,
      provider: "MOCK",
    };
  }
}
```

### Production Twilio Provider (`integrations/sms/twilioSms.adapter.js`)

```javascript
import twilio from "twilio";
import { ISmsAdapter } from "./smsAdapter.interface";

export class TwilioSmsAdapter extends ISmsAdapter {
  constructor(accountSid, authToken, fromNumber) {
    super();
    this.client = twilio(accountSid, authToken);
    this.fromNumber = fromNumber;
  }

  async sendSMS({ to, message, referenceId }) {
    const res = await this.client.messages.create({
      body: message,
      from: this.fromNumber,
      to,
    });
    return { success: true, messageId: res.sid, provider: "TWILIO" };
  }
}
```

---

## 3. Provider Failover Chain Strategy

If the primary SMS provider (e.g., Twilio) fails or returns an HTTP error:

1. The adapter catches the provider exception.
2. The `SmsAdapterManager` automatically attempts dispatch via the secondary failover provider (e.g., MSG91 or AWS SNS).
3. If both providers fail, the job throws an exception, placing the job into BullMQ's exponential retry queue.

---

## 4. In-App Notification Inbox Strategy

In-App notifications are written directly to the PostgreSQL `notifications` table:

```sql
INSERT INTO notifications (
  id, user_id, title, body, action_url, priority, status, created_at
) VALUES (
  gen_random_uuid(), :userId, :title, :body, :actionUrl, :priority, 'UNREAD', CURRENT_TIMESTAMP
);
```

When a user opens the app, the unread count badge fetches `GET /api/v1/notifications/unread-count`. When displayed, real-time Socket.IO broadcasts `NOTIFICATION_RECEIVED` to update the UI inbox dynamically.

---

_Document Version: 1.0 | Phase: 2 — Architecture | Status: Approved Blueprint_
