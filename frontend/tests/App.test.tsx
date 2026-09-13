import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../src/app/QueryClient";
import { AppRouter } from "../src/routes/AppRouter";
import { describe, it, expect } from "vitest";

describe("SmartProcure Application Shell", () => {
  it("renders application title and navigation elements", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRouter />
        </BrowserRouter>
      </QueryClientProvider>,
    );

    expect(screen.getAllByText(/SmartProcure/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Dashboard Overview/i)).toBeInTheDocument();
    expect(screen.getByText(/Health & Readiness/i)).toBeInTheDocument();
  });
});
