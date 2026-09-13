import { render, screen } from "@testing-library/react";
import { Button } from "../src/components/Button";
import { describe, it, expect } from "vitest";

describe("Button Component", () => {
  it("renders button with children label", () => {
    render(<Button>Click Me</Button>);
    expect(
      screen.getByRole("button", { name: /click me/i }),
    ).toBeInTheDocument();
  });

  it("disables button when isLoading is true", () => {
    render(<Button isLoading>Submit</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });
});
