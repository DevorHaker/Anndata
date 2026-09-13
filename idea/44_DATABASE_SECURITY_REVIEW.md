# 44 — DATABASE SECURITY & PRIVACY AUDIT REVIEW

## SmartProcure: Database Security Controls, PII Minimization, and Threat Audit

---

## 1. Security & Privacy Audit Verification Matrix

| Security Parameter               | Security Audit Finding                                 | Architectural Safeguard / Mitigation                                                                                                             |   Status   |
| -------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | :--------: |
| **Sensitive PII Minimization**   | Bank Account Numbers & IFSC codes are stored           | AES-256-GCM encryption before DB write (`farmer_bank_accounts`). Masked `account_last_four` stored for UI.                                       | **PASSED** |
| **Government Identity Security** | Aadhaar / Government IDs are not required for core ops | PII minimized. System uses non-sensitive UUIDs and `farmer_reference_id`.                                                                        | **PASSED** |
| **Public QR Code Presentation**  | Public QR codes scanned at gate gates                  | QR code encodes non-sensitive `token_code` signed with HMAC-SHA256 signature. No PII embedded in QR payload.                                     | **PASSED** |
| **SQL Injection Vulnerability**  | Dynamic SQL query risks                                | Knex/pg parameterized SQL queries exclusively. Database `CHECK` constraints validate string formats.                                             | **PASSED** |
| **Cross-Tenant Data Exposure**   | User querying unauthorized centre data                 | PostgreSQL Row-Level Security (RLS) policies enforce data isolation by `centre_id` and `farmer_id`.                                              | **PASSED** |
| **Audit Trail Tampering**        | Malicious officer modifying audit logs                 | SQL `UPDATE` and `DELETE` privileges strictly revoked on `audit_logs` table for application DB user.                                             | **PASSED** |
| **Financial Overwrite Fraud**    | Officer overwriting net weighments or payouts          | Generated stored columns (`net_weight_kg`, `net_payable_amount`) computed by PostgreSQL C engine; corrections logged in `weighment_corrections`. | **PASSED** |
| **Superuser Connection Risks**   | App connecting as `postgres` superuser                 | Isolated role `smartprocure_app` with least privilege access (`SELECT`, `INSERT`, `UPDATE` only).                                                | **PASSED** |

---

_Document Version: 1.0 | Phase: 3 — Database Architecture | Status: Approved Blueprint_
