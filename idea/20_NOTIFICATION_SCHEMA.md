# 20 — NOTIFICATION DATABASE SCHEMA

## SmartProcure: Multi-Channel Messaging, Dispatch History, and Templates

---

## 1. Table Specifications

### 1.1 `notifications`

In-app notification records presented in user UI feeds.

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  body TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,              -- 'BOOKING_CONFIRMATION', 'QUEUE_CALL', 'PAYMENT_DISBURSED'
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
```

### 1.2 `notification_logs`

Out-of-band delivery logs (SMS, Email) managed asynchronously by BullMQ workers.

```sql
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel VARCHAR(20) NOT NULL,               -- 'SMS', 'EMAIL', 'PUSH'
  recipient_target VARCHAR(100) NOT NULL,     -- Mobile Number or Email Address
  template_code VARCHAR(50) NOT NULL,         -- E.g. 'SMS_BOOKING_SUCCESS'
  payload JSONB NOT NULL,
  provider VARCHAR(50) NOT NULL DEFAULT 'MOCK', -- 'TWILIO', 'MSG91', 'AWS_SES'
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'SENT', 'FAILED'
  retry_count INTEGER NOT NULL DEFAULT 0,
  provider_message_id VARCHAR(100) NULL,
  error_message TEXT NULL,
  sent_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notification_logs_status ON notification_logs(status);
```

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
