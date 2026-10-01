import Link from "next/link";
import { USE_MOCK_API } from "@/lib/constants";
import { Icon } from "@/components/ui/Icon";

export function AppHeader({ active = "upload" }: { active?: "upload" | "job" }) {
  return (
    <header className="app-header">
      <div className="page-shell header-inner">
        <Link className="brand-lockup" href="/" aria-label="Gnani AI Audio Intelligence home">
          <span className="brand-mark"><Icon name="wave" size={23} strokeWidth={2.1} /></span>
          <span className="brand-copy"><strong>Gnani AI</strong><span>Audio Intelligence</span></span>
        </Link>

        <nav className="primary-nav" aria-label="Main navigation">
          <Link href="/" className={`nav-link ${active === "upload" ? "nav-link-active" : ""}`} aria-current={active === "upload" ? "page" : undefined}>
            Upload
          </Link>
          <button className="nav-link nav-link-disabled" type="button" disabled aria-label="History is coming soon">
            History <span className="soon-label">Soon</span>
          </button>
        </nav>

        <div className={`connection-badge ${USE_MOCK_API ? "connection-demo" : "connection-live"}`}>
          <span className="connection-dot" />
          <span>{USE_MOCK_API ? "Demo workspace" : "FastAPI mode"}</span>
        </div>
      </div>
    </header>
  );
}
