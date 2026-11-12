import { tools } from "../data";
import { PageHeader, Panel } from "../ui";

export default function ToolsPage() {
  return (
    <>
      <PageHeader title="Tools" description="Systems built for CyberPH." />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((t) => (
          <Panel key={t.name} title={t.name}>
            <p className="flex-1 text-sm leading-6 text-slate-600">{t.description}</p>
            <div className="mt-5 flex gap-4 border-t border-slate-200 pt-4 text-sm">
              {t.url && (
                <a href={t.url} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 underline-offset-2 hover:underline">
                  Open
                </a>
              )}
              <a href={t.repo} target="_blank" rel="noopener noreferrer" className="text-brand-700 underline-offset-2 hover:underline">
                Repository
              </a>
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}
