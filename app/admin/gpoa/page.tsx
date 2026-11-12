import { PageHeader, Panel } from "../ui";

// The GPOA Google Doc. /preview is Google's read-only view; needs the doc shared "anyone with the link".
const DOC_ID = "1LOgbZVMQseBwXqNukUFj7Dhyc9DHmwgOy4gRLmZqGYU";

// On desktop the page fits the screen (4rem = layout's py-8) so only the doc scrolls.
export default function GpoaPage() {
  return (
    <div className="flex flex-col md:h-[calc(100dvh-4rem)]">
      <PageHeader title="GPOA" description="General Plan of Activities, A.Y. 2026–2027." />
      <Panel
        action={{ href: `https://docs.google.com/document/d/${DOC_ID}/edit`, label: "Open in Google Docs" }}
        className="min-h-0 flex-1"
      >
        <iframe
          title="CyberPH GPOA"
          src={`https://docs.google.com/document/d/${DOC_ID}/preview`}
          className="h-[80vh] w-full rounded-lg border border-slate-200 bg-white md:h-auto md:flex-1"
        />
      </Panel>
    </div>
  );
}
