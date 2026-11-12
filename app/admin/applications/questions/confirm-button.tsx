"use client";

import type { ReactNode } from "react";

// Submit button that asks first. `formAction` overrides the form's action (e.g. Remove inside an edit form).
export default function ConfirmButton({
  message,
  formAction,
  className,
  children,
}: {
  message: string;
  formAction?: (formData: FormData) => Promise<void>;
  className: string;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      formAction={formAction}
      formNoValidate
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
      className={className}
    >
      {children}
    </button>
  );
}
