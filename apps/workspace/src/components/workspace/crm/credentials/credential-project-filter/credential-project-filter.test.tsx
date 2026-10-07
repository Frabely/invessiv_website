// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getCrmCredentialsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { CredentialProjectFilter } from "./credential-project-filter";

const content = getCrmCredentialsDictionary("de").filter;
afterEach(cleanup);

describe("CredentialProjectFilter", () => {
  it.each([true, false])(
    "offers only readable scopes (customer-wide: %s)",
    (customerWide) => {
      const change = vi.fn();
      render(
        <CredentialProjectFilter
          content={content}
          customerWide={customerWide}
          projects={[{ id: "p1", title: "Website" }]}
          projectId={undefined}
          onChangeAction={change}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: content.label }));
      expect(
        screen.queryByRole("option", { name: content.customerWide }) !== null,
      ).toBe(customerWide);
      fireEvent.click(screen.getByRole("option", { name: "Website" }));
      expect(change).toHaveBeenCalledExactlyOnceWith("p1");
      fireEvent.click(screen.getByRole("button", { name: content.label }));
      fireEvent.click(screen.getByRole("option", { name: content.all }));
      expect(change).toHaveBeenLastCalledWith(undefined);
    },
  );
});
