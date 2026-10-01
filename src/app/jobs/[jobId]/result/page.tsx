import { ResultPage } from "@/components/results/ResultPage";

export default async function JobResultPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  return <ResultPage jobId={jobId} />;
}
