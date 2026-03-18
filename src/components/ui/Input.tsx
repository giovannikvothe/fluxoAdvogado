import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({ label, error, id, ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replaceAll(" ", "-");

  return (
    <label className="field" htmlFor={inputId}>
      <span>{label}</span>
      <input id={inputId} className="input" {...props} />
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

