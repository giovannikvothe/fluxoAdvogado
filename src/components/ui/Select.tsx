import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
};

export function Select({ label, error, id, children, ...props }: SelectProps) {
  const selectId = id ?? label.toLowerCase().replaceAll(" ", "-");

  return (
    <label className="field" htmlFor={selectId}>
      <span>{label}</span>
      <select id={selectId} className="input" {...props}>
        {children}
      </select>
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

