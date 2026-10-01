import { ProcessingPage } from "@/components/processing/ProcessingPage";

export default async function JobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return <ProcessingPage jobId={jobId} />;
}
