import { Icon } from "@/components/ui/Icon";

export function Loading({ label }: { label: string }) {
  return (
    <div className="loading-block" role="status" aria-live="polite">
      <span className="loading-mark"><Icon name="spinner" size={22} /></span>
      <span>{label}</span>
    </div>
  );
}
