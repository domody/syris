import { Badge } from "@/components/ui/badge";
import type { AuditLevel } from "@/types";

export function AuditLevelBadge({ level }: { level: AuditLevel }) {
  if (level === "error") return <Badge label="error" variant="error" />;
  if (level === "warn") return <Badge label="warn" variant="warning" />;
  return <Badge label="info" variant="neutral" />;
}
