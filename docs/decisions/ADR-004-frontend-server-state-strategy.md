# ADR-004: Frontend Server-State Strategy

## Status

Accepted

## Context

Web applications often struggle with state management by placing API response data into global stores (e.g., Redux), leading to boilerplate code, cache invalidation bugs, and sync issues.

## Decision

We separate server state from local UI state:

- **Server Data**: Managed exclusively via **TanStack Query (React Query)**. Handles caching, background refetching, loading/error states, and optimistic updates automatically.
- **Local Component State**: Managed via standard `useState` and `useReducer`.
- **Form State**: Managed via **React Hook Form** + **Zod** schema resolvers.
- **Global Client UI State**: Lightweight Zustand store only if cross-component UI state (e.g., theme toggle, sidebar open) is needed. Redux is explicitly avoided.

## Consequences

- **Positive**: Drastically reduced boilerplate code, automatic cache invalidation, cleaner component separation.
- **Negative**: Developers must understand TanStack Query query keys and mutation strategies.
