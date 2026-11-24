import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { Pagination } from "./Pagination";

it("keeps large result pagination compact and navigates around the current page", () => {
  const onChange = vi.fn();
  render(<Pagination page={50} pageCount={1000} onChange={onChange} />);
  expect(screen.getAllByRole("button")).toHaveLength(7);
  expect(screen.getByRole("button", { name: "50ページ目" }).getAttribute("aria-current")).toBe("page");
  fireEvent.click(screen.getByRole("button", { name: "次のページ" }));
  expect(onChange).toHaveBeenCalledWith(51);
});
it("disables paging beyond the first and last page", () => {
  const view = render(<Pagination page={1} pageCount={3} onChange={vi.fn()} />);
  expect((screen.getByRole("button", { name: "前のページ" }) as HTMLButtonElement).disabled).toBe(true);
  view.rerender(<Pagination page={3} pageCount={3} onChange={vi.fn()} />);
  expect((screen.getByRole("button", { name: "次のページ" }) as HTMLButtonElement).disabled).toBe(true);
});
