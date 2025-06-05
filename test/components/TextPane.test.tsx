import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { TextPane } from "@/components/TextPane";
import userEvent from "@testing-library/user-event";

describe("TextPane", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders text content and calculates word count", () => {
    const text = "Sample text content";
    render(<TextPane text={text} id="test-pane" />);
    
    expect(screen.getByText(text)).toBeInTheDocument();
    expect(screen.getByText("3 words,")).toBeInTheDocument();
  });

  it("syncs scroll between paired panes", () => {
    const pairedRef = {
      current: document.createElement("div")
    };
    Object.defineProperties(pairedRef.current, {
      scrollHeight: { value: 1000 },
      clientHeight: { value: 200 },
      scrollTop: { value: 0, writable: true },
      _isSyncing: { value: false, writable: true }
    });

    const { container } = render(
      <TextPane
        text={Array(20).fill("Sample text").join("\n")}
        id="test-pane"
        pairedRef={pairedRef}
      />
    );

    const pane = container.querySelector("[role=\"region\"]");
    if (!pane) throw new Error("Could not find pane element");
    Object.defineProperties(pane, {
      scrollHeight: { value: 1000 },
      clientHeight: { value: 200 },
      scrollTop: { value: 100, writable: true },
      _isSyncing: { value: false, writable: true }
    });

    fireEvent.scroll(pane);
    expect(pairedRef.current.scrollTop).toBeGreaterThan(0);
  });

  it("handles text highlighting when enabled", async () => {
    const user = userEvent.setup();
    const onHighlight = vi.fn();
    
    render(
      <TextPane
        text="Sample text for highlighting"
        id="test-pane"
        enableHighlight
        onHighlight={onHighlight}
      />
    );

    const mockSelection = "highlighted text";
    vi.spyOn(window, "getSelection").mockImplementation(() => ({
      toString: () => mockSelection,
      removeAllRanges: vi.fn()
    } as unknown as Selection));

    const textElement = screen.getByRole("region");
    await user.click(textElement);

    expect(onHighlight).toHaveBeenCalledWith(mockSelection);
  });

  it("prevents scroll bounce with _isSyncing flag", () => {
    const pairedRef = {
      current: document.createElement("div")
    };
    Object.defineProperties(pairedRef.current, {
      scrollHeight: { value: 1000 },
      clientHeight: { value: 200 },
      scrollTop: { value: 0, writable: true },
      _isSyncing: { value: true, writable: true }
    });

    const { container } = render(
      <TextPane
        text={Array(20).fill("Sample text").join("\n")}
        id="test-pane"
        pairedRef={pairedRef}
      />
    );

    const pane = container.querySelector("[role=\"region\"]");
    if (!pane) throw new Error("Could not find pane element");
    Object.defineProperties(pane, {
      scrollHeight: { value: 1000 },
      clientHeight: { value: 200 },
      scrollTop: { value: 100, writable: true },
      _isSyncing: { value: true, writable: true }
    });

    fireEvent.scroll(pane);
    expect(pairedRef.current.scrollTop).toBe(0);
  });

  it("shows/hides expand button based on text length", async () => {
    const user = userEvent.setup();
    const longText = Array(50).fill("Sample text").join("\n");

    const { rerender } = render(
      <TextPane
        text="Short text"
        id="test-pane"
      />
    );

    expect(screen.queryByText("Show More")).not.toBeInTheDocument();

    rerender(
      <TextPane
        text={longText}
        id="test-pane"
      />
    );

    const showMoreButton = screen.getByText("Show More");
    expect(showMoreButton).toBeInTheDocument();

    await user.click(showMoreButton);
    expect(screen.getByText("Show Less")).toBeInTheDocument();
  });
});
