import { Icon } from "@/components/ui/Icon";

export function ErrorMessage({
  children,
  className = ""
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={`error-message ${className}`} role="alert">
      <Icon name="alert" size={18} />
      <p>{children}</p>
    </div>
  );
}
