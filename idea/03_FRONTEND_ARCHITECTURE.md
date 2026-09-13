# 03 — FRONTEND ARCHITECTURE

## SmartProcure: React + Vite Frontend Client Architecture

---

## 1. Technology Stack & Directory Structure

### Stack Specifications

- **Framework**: React 18+ (Vite build tool)
- **Routing**: React Router v6
- **Server State Management**: TanStack Query v5 (React Query)
- **Global Client State**: Zustand (minimal footprint)
- **Form Management**: React Hook Form
- **Validation Schema**: Zod
- **Styling**: Vanilla CSS Modules / Tailored Design System (Modern Glassmorphism, CSS Variables)
- **PWA Capabilities**: Vite PWA plugin (Service Workers, Cache API for offline QR viewing)

### Repository Directory Structure

```
frontend/
├── public/
│   ├── favicon.ico
│   ├── manifest.json
│   └── icons/
├── src/
│   ├── app/                    # Application wrapper, providers, global styles
│   │   ├── App.jsx
│   │   ├── providers.jsx       # QueryClient, Auth, Router providers
│   │   └── index.css           # Design tokens, variables, resets
│   ├── assets/                 # SVGs, images, static media
│   ├── components/             # Reusable atomic UI components (Design System)
│   │   ├── ui/                 # Buttons, Inputs, Cards, Badges, Modals, Spinners
│   │   ├── feedback/           # Toast, ErrorBoundaries, SkeletonLoaders
│   │   └── layout/             # Header, Sidebar, Footer, PageContainer
│   ├── features/               # Domain feature modules (encapsulated)
│   │   ├── auth/               # LoginForm, RegisterForm, OTPInput, useAuth
│   │   ├── farmers/            # ProfileEditor, ProduceList, DocumentUploader
│   │   ├── bookings/           # SlotPicker, BookingCard, BookingWizard
│   │   ├── queue/              # LiveQueueDisplay, QueuePositionBadge, ETATimer
│   │   ├── procurement/        # WeighmentForm, InspectionForm, DecisionModal
│   │   └── analytics/          # CongestionGauge, ThroughputChart, MetricsGrid
│   ├── hooks/                  # Cross-cutting custom React hooks
│   │   ├── useDebounce.js
│   │   ├── useSocket.js
│   │   └── useGeolocation.js
│   ├── layouts/                # Page layout templates
│   │   ├── AuthLayout.jsx
│   │   ├── FarmerLayout.jsx
│   │   └── AdminLayout.jsx
│   ├── pages/                  # Page route targets (thin wrappers around feature components)
│   │   ├── farmer/             # Dashboard, Booking, TokenView, History
│   │   ├── officer/            # ScanCheckIn, ActiveQueue, Weighment, Quality
│   │   ├── manager/            # CentreDashboard, CapacityConfig, Reports
│   │   └── shared/             # NotFound, Unauthorized, ServerError
│   ├── routes/                 # Route guards, permission checks, router config
│   │   ├── index.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── RoleGuard.jsx
│   ├── services/               # API HTTP client and WebSocket connections
│   │   ├── api.js              # Axios instance with interceptors
│   │   ├── socket.js           # Socket.IO client singleton
│   │   └── endpoints/          # API domain query functions
│   ├── store/                  # Zustand stores for transient client state
│   │   ├── authStore.js        # Auth user token & role state
│   │   └── uiStore.js          # Sidebar collapse, active theme, toast stack
│   ├── utils/                  # Pure utility functions
│   │   ├── formatters.js       # Date, currency, weight formatters
│   │   ├── validators.js       # Shared regex patterns
│   │   └── storage.js          # Encrypted localStorage helpers
│   └── validation/             # Zod validation schemas
│       ├── authSchema.js
│       ├── bookingSchema.js
│       └── procurementSchema.js
├── vite.config.js
└── package.json
```

---

## 2. State Management Categorization

To avoid state duplication and stale data bugs, client state is strictly segregated into three categories:

| State Type                | Management Tool              | Responsibilities / Storage                                                                                                                                |
| ------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Server State**          | TanStack Query v5            | Remote API cache, bookings history, slot counts, queue lists, analytics data. Handles caching, background refetching, mutation invalidation, and polling. |
| **Global Client State**   | Zustand                      | Active user session info, authentication JWT, active role, active centre ID, UI sidebar state, persistent preference settings.                            |
| **Local Component State** | `useState` / React Hook Form | Form field values, dropdown toggles, modal visibility, step wizard state, local filter inputs.                                                            |

---

## 3. Server State & API Client Architecture

### Axios Instance Configuration (`services/api.js`)

```javascript
import axios from "axios";
import { useAuthStore } from "../store/authStore";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api/v1",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach JWT Bearer Token & Correlation ID
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers["X-Request-ID"] = crypto.randomUUID();
  return config;
});

// Response Interceptor: Uniform Error Handling & Silent Refresh
api.interceptors.response.use(
  (response) => response.data, // Strip to standard `{ success, data, meta }`
  async (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login?reason=session_expired";
    }
    return Promise.reject(
      error.response?.data?.error || { message: "Network error occurred" },
    );
  },
);
```

---

## 4. Permission-Aware UI & Route Guards

### RoleGuard Component (`routes/RoleGuard.jsx`)

```jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export const RoleGuard = ({ allowedRoles }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
```

---

## 5. Low-Bandwidth & Offline Strategy for Rural Farmers

1. **PWA Offline QR Caching**:
   - When a booking is confirmed, the digital QR token, short code, and booking details are cached in `IndexedDB` / Service Worker Cache.
   - When a farmer opens the app with zero connectivity, the Token screen reads from local cache, allowing QR presentation at the centre scan gate.

2. **Optimistic Queue & Polling Fallback**:
   - If WebSocket connection drops due to poor rural connectivity, TanStack Query automatically falls back to HTTP polling at adaptive intervals (30s -> 60s).

3. **Asset Minimization & Skeleton Loaders**:
   - Build output code-split by route using React `lazy()` and `Suspense`.
   - SVG icons bundled inline; layout skeletons displayed immediately to minimize perceived latency.

---

_Document Version: 1.0 | Phase: 2 — Architecture | Status: Approved Blueprint_
