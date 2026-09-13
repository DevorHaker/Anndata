# Privacy & Personal Data Map — SmartProcure

## 1. Data Classification & Privacy Principles
SmartProcure handles Personally Identifiable Information (PII) of farmers, procurement officers, and administrative staff under least-privilege access and data minimization principles.

---

## 2. Personal Data Mapping Table

| Data Element | Primary Owner / Source | Storage Location | Sensitivity Level | Access Control | Retention / Masking Policy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Mobile Number** | Farmer / Staff Input | `users.mobile_number` | High (PII) | Authenticated User / Staff | Redacted in standard logs; mandatory for OTP authentication. |
| **Full Name** | Farmer Registration | `farmers.first_name`, `farmers.last_name` | Medium | Centre Staff / Admin / Self | Displayed in mandi queues and payment vouchers. |
| **Aadhaar Number / Hash** | Farmer KYC | `farmers.aadhaar_hash` | Critical (PII) | Restricted / System | SHA-256 hashed at rest; never logged or exposed in plain text. |
| **Bank Account & IFSC** | Farmer Payment Profile | `farmers.bank_account_number`, `farmers.ifsc_code` | Critical (Financial) | Payment Gateway / System Admin | Masked as `XXXX XXXX 4521` on all public interfaces. |
| **Land Holding Data** | Revenue DB / Farmer Input | `farmers.land_area_acres`, `farmers.survey_number` | High | Procurement Officer / System | Used solely for capacity verification & quota calculations. |
| **GPS Location / Geofence** | Device / Browser PWA | Memory / Log Context | Medium | Gate Check-in Service | Used solely for mandi proximity verification during gate check-in. |

---

## 3. Privacy & Compliance Controls
1. **Log Sanitization**: Automated Winston log filter redacts `password`, `otp`, `jwt`, `aadhaar`, `account_number`, and `ifsc` automatically.
2. **Right to Erasure / Soft Delete**: All tables implement `deleted_at IS NULL` filters with anonymization support for revoked accounts.
3. **Data Minimization**: API responses return only fields required for the active user role view.
