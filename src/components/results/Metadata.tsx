import type { AudioMetadata } from "@/lib/api/types";
import { formatDuration, formatFileSize, formatLanguageName } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

export function Metadata({
  metadata,
  fileName,
  fileSize
}: {
  metadata?: AudioMetadata;
  fileName: string;
  fileSize?: number;
}) {
  const duration = formatDuration(metadata?.duration);
  const language = formatLanguageName(metadata?.language);
  const size = fileSize ?? metadata?.file_size_bytes;
  const items = [
    { label: "Source file", value: fileName, icon: "file" as const },
    ...(duration ? [{ label: "Duration", value: duration, icon: "clock" as const }] : []),
    ...(language ? [{ label: "Language", value: language, icon: "globe" as const }] : []),
    ...(size !== undefined ? [{ label: "File size", value: formatFileSize(size), icon: "music" as const }] : []),
    { label: "Status", value: "Completed", icon: "check" as const }
  ];

  return (
    <section className="metadata-card" aria-labelledby="metadata-title">
      <div className="metadata-heading"><span className="section-kicker">JOB DETAILS</span><h2 id="metadata-title">File information</h2></div>
      <dl className="metadata-list">
        {items.map((item) => (
          <div className="metadata-item" key={item.label}>
            <dt><Icon name={item.icon} size={15} />{item.label}</dt>
            <dd title={item.value}>{item.value}</dd>
          </div>
        ))}
      </dl>
      <div className="metadata-footer"><span className="metadata-status-dot" />Results ready to review</div>
    </section>
  );
}
