import type { StatusDemanda } from "../types/domain";

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR");
const DATETIME_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

export function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }

  return DATE_FORMATTER.format(new Date(value));
}

export function formatDateTime(value: string | null): string {
  if (!value) {
    return "-";
  }

  return DATETIME_FORMATTER.format(new Date(value));
}

export function toDateInputValue(value: string | null): string {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

export function isDemandOverdue(status: StatusDemanda, prazoFinal: string | null): boolean {
  if (!prazoFinal || status === "finalizada" || status === "cancelada") {
    return false;
  }

  const today = new Date();
  const dueDate = new Date(`${prazoFinal}T23:59:59`);
  return dueDate.getTime() < today.getTime();
}

export function normalizeOptionalText(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
