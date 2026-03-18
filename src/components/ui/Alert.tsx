type AlertVariant = "error" | "success" | "info";

type AlertProps = {
  message?: string;
  variant?: AlertVariant;
};

export function Alert({ message, variant = "info" }: AlertProps) {
  if (!message) {
    return null;
  }

  return <p className={`alert alert-${variant}`}>{message}</p>;
}

