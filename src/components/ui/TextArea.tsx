import type { TextareaHTMLAttributes } from "react";

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
};

export function TextArea({ label, error, id, ...props }: TextAreaProps) {
  const textAreaId = id ?? label.toLowerCase().replaceAll(" ", "-");

  return (
    <label className="field" htmlFor={textAreaId}>
      <span>{label}</span>
      <textarea id={textAreaId} className="input textarea" {...props} />
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

