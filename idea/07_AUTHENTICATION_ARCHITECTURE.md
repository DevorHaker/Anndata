# 07 — AUTHENTICATION ARCHITECTURE

## SmartProcure: User Identity, Token Strategy, and Session Security Design

---

## 1. Architectural Strategy Choice: JWT vs. Stateful Sessions

### Evaluated Approaches

1. **Traditional Server-Side Sessions (Redis Store)**: High database/Redis lookup per request; strict revocation capability; difficult to scale horizontally across multi-region edge deployments.
2. **Stateless JWT (JSON Web Tokens)**: Fast, zero-database lookup per API request; scales seamlessly; revocation requires a Redis blacklist or short TTLs.

### SmartProcure Hybrid Decision

SmartProcure utilizes a **Hybrid Dual-Token JWT System** backed by Redis session tracking.

```
Access Token (JWT)  -> Short-lived (15 minutes), stateless signature verification at API gateway.
Refresh Token (JWT) -> Long-lived (7 days), stored in HttpOnly, Secure, SameSite Cookie.
                       Validated against Redis `user_sessions` hash on renewal.
```

**Why this hybrid approach?**

- Provides high performance for API routes (99% of requests hit zero database authentication penalty).
- Retains instant revocation capability: Logging out, suspending an account, or changing a password invalidates the Refresh Session in Redis immediately.

---

## 2. Authentication Credentials & Tokens

### 2.1 Password Hashing Specification

- **Algorithm**: `bcrypt` with minimum cost factor **12** (or `Argon2id`).
- **Salt Generation**: Unique 128-bit cryptographically secure salt generated per user password.

### 2.2 OTP Verification Specification

- **Length**: 6-digit cryptographically secure random number.
- **TTL**: 5 minutes (300 seconds).
- **Storage**: Redis key `otp:{mobileNumber}` with auto-expire TTL.
- **Rate Limit**: Max 3 OTP requests per phone number per 10 minutes.
- **Verification Attempt Cap**: Maximum 3 invalid attempts per OTP before key destruction.

### 2.3 JWT Token Structure

#### Access Token Payload

```json
{
  "sub": "usr_98124810-b912-421f-8291-01bc09a12821",
  "role": "FARMER",
  "farmerId": "fm_48192019-1234-5678-90ab-cdef12345678",
  "centreId": null,
  "sessionId": "ses_77123901-8812-411a-9921-123456789012",
  "iat": 1757750400,
  "exp": 1757751300,
  "iss": "smartprocure-auth-service"
}
```

- **Signing Algorithm**: RS256 (RSA 2048-bit Private Key on Server, Public Key on Verifiers) in production; HS256 for local dev.

#### Refresh Token Payload

```json
{
  "sub": "usr_98124810-b912-421f-8291-01bc09a12821",
  "sessionId": "ses_77123901-8812-411a-9921-123456789012",
  "iat": 1757750400,
  "exp": 1758355200,
  "iss": "smartprocure-auth-service"
}
```

---

## 3. Session Security & Refresh Workflow

```
[Client UI]                                 [API Server]                         [Redis Session Store]
     │                                           │                                         │
     │─── POST /api/v1/auth/login ──────────────>│                                         │
     │    { mobile, password }                   │─── Verify password (bcrypt)             │
     │                                           │─── Generate Session ID (UUID)           │
     │                                           │─── Set Session in Redis ───────────────>│ HSET user_sessions:{userId}
     │<── Response 200 OK ───────────────────────│    (sessionId, device, ip, active)      │
     │    Body: { accessToken }                  │                                         │
     │    Cookie: refreshToken (HttpOnly)        │                                         │
     │                                           │                                         │
     │─── API Request GET /bookings ────────────>│                                         │
     │    Header: Bearer {accessToken}           │─── Fast JWT Signature Check (RS256)     │
     │                                           │    (Zero DB/Redis lookup required!)     │
     │<── Data Payload ──────────────────────────│                                         │
     │                                           │                                         │
     │─── Token Expired (401) ──────────────────>│                                         │
     │─── POST /api/v1/auth/refresh ───────────>│                                         │
     │    Cookie: refreshToken                   │─── Verify Refresh JWT signature         │
     │                                           │─── Check Session Active? ──────────────>│ HGET user_sessions:{userId}
     │                                           │    (If Revoked -> 401 Reject)           │
     │<── Response 200 OK ───────────────────────│─── Rotate Refresh Token                 │
     │    Body: { newAccessToken }               │─── Update Session Last Active ─────────>│
     │    Cookie: newRefreshToken                │                                         │
```

---

## 4. Account Lockout & Abuse Prevention Rules

1. **Failed Login Lockout**: 5 consecutive failed password attempts for a mobile number locks the account for **30 minutes**. Tracked via Redis `login_failures:{mobileNumber}`.
2. **IP Rate Limiting**: Max 10 auth endpoint requests per minute per IP address.
3. **Session Revocation (Logout All)**: When a user changes password or invokes "Logout All Devices", the API server executes `DEL user_sessions:{userId}` in Redis. All active refresh tokens become instantly useless.

---

_Document Version: 1.0 | Phase: 2 — Architecture | Status: Approved Blueprint_
