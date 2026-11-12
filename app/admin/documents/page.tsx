import { connection } from "next/server";
import { Suspense } from "react";
import { PageHeader, Panel } from "../ui";
import { FOLDER_ID, listDriveFiles } from "./drive";
import FileBrowser from "./file-browser";

export default function DocumentsPage() {
  return (
    <>
      <PageHeader title="Documents" description="The CyberPH shared Google Drive folder." />
      <Panel
        title="Shared drive"
        action={{ href: `https://drive.google.com/drive/folders/${FOLDER_ID}`, label: "Open in Google Drive" }}
      >
        <Suspense fallback={<p className="text-sm text-slate-500">Loading files…</p>}>
          <Files />
        </Suspense>
        <p className="mt-3 text-xs text-slate-500">
          Click a file to open it in Google Drive. To add or edit files, use Open in Google Drive.
        </p>
      </Panel>
    </>
  );
}

async function Files() {
  await connection();
  const files = await listDriveFiles().catch(() => null);
  if (!files) return <p className="text-sm text-rose-700">Could not load the Drive folder. Use Open in Google Drive.</p>;
  return <FileBrowser files={files} />;
}
