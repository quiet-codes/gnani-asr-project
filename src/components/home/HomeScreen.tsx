"use client";

import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { AudioUploader } from "@/components/upload/AudioUploader";
import { Icon } from "@/components/ui/Icon";
import { saveJobLocalInfo } from "@/lib/job-storage";
import { USE_MOCK_API } from "@/lib/constants";
import type { Job } from "@/lib/api/types";

export function HomeScreen() {
  const router = useRouter();

  function handleJobCreated(job: Job, file: File) {
    saveJobLocalInfo(job.job_id, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      createdAt: Date.now()
    });
    router.push(`/jobs/${encodeURIComponent(job.job_id)}`);
  }

  return (
    <>
      <AppHeader active="upload" />
      <main className="page-shell home-main">
        <section className="home-hero" aria-labelledby="home-title">
          <div className="hero-copy">
            <div className="eyebrow hero-eyebrow"><span className="eyebrow-mark" />AUDIO INTELLIGENCE WORKSPACE</div>
            <h1 id="home-title">Turn Audio Into <span>Intelligence.</span></h1>
            <p>Upload an audio file and get an accurate transcript and AI-generated summary.</p>
            <div className="hero-benefits" aria-label="What you get">
              <span><Icon name="check" size={14} /> Clear transcripts</span>
              <span><Icon name="check" size={14} /> Useful summaries</span>
              <span><Icon name="check" size={14} /> Ready to share</span>
            </div>
          </div>
          <aside className="hero-note" aria-label="Audio workflow">
            <div className="hero-note-top"><span className="hero-note-label">FROM AUDIO</span><span className="hero-note-status"><span /> READY</span></div>
            <div className="waveform-art" aria-hidden="true">
              {[18, 30, 23, 43, 26, 56, 37, 64, 41, 26, 49, 31, 57, 22, 43, 28, 50, 34, 20].map((height, index) => (
                <span key={index} style={{ height: `${height}px` }} />
              ))}
            </div>
            <div className="hero-note-bottom">
              <div><span className="hero-note-label">TO CLEAR TAKEAWAYS</span><strong>One conversation. One clear record.</strong></div>
              <span className="hero-note-icon"><Icon name="arrow-right" size={17} /></span>
            </div>
          </aside>
        </section>

        <section className="upload-panel" aria-labelledby="upload-title">
          <div className="upload-panel-heading">
            <div>
              <span className="section-kicker">01 — START A NEW JOB</span>
              <h2 id="upload-title">Add your audio</h2>
            </div>
            <p>We’ll take it from here. Preview your file, then start transcription when you’re ready.</p>
          </div>
          <AudioUploader onJobCreated={handleJobCreated} />
          <div className="upload-panel-footnote">
            <Icon name="lock" size={15} />
            <span>{USE_MOCK_API ? "Demo mode: audio is not uploaded; this job uses clearly labelled sample results." : "Files are sent directly to the FastAPI backend configured for this workspace."}</span>
          </div>
        </section>

        <section className="workflow-row" aria-label="How it works">
          <div className="workflow-step"><span className="workflow-number">01</span><div><strong>Upload once</strong><p>MP3, WAV, M4A and more</p></div></div>
          <span className="workflow-divider" aria-hidden="true" />
          <div className="workflow-step"><span className="workflow-number">02</span><div><strong>Follow progress</strong><p>See each processing stage</p></div></div>
          <span className="workflow-divider" aria-hidden="true" />
          <div className="workflow-step"><span className="workflow-number">03</span><div><strong>Get the essentials</strong><p>Transcript, summary, and export</p></div></div>
        </section>

        <footer className="home-footer"><span>GNANI AI <span className="footer-dot">·</span> AUDIO INTELLIGENCE</span><span>Designed for conversations that matter.</span></footer>
      </main>
    </>
  );
}
