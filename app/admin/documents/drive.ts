// CyberPH shared Google Drive folder. Works only while the folder is shared "anyone with the link".
export const FOLDER_ID = "15MamjaX7vX8yPO2b6FIKodQfUI2HD3o6";

export type DriveFile = { id: string; title: string; href: string; type: string; thumb?: string; modified: string };

const TYPES: Record<string, string> = {
  "vnd.google-apps.document": "Docs",
  "vnd.google-apps.spreadsheet": "Sheets",
  "vnd.google-apps.presentation": "Slides",
  "vnd.google-apps.form": "Forms",
  "vnd.google-apps.folder": "Folder",
  pdf: "PDF",
};

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

// shortcut: scrapes Google's public embed page (no API key), upgrade to the Drive API if Google changes the markup.
export function parseDriveEmbed(html: string): DriveFile[] {
  return html.split('<div class="flip-entry"').slice(1).map((e) => {
    const icon = e.match(/flip-entry-list-icon"><img src="[^"]*\/type\/([^"]+)"/)?.[1] ?? "";
    const sub = icon.split("/").pop() ?? "";
    return {
      id: e.match(/id="entry-([^"]+)"/)?.[1] ?? "",
      title: decode(e.match(/flip-entry-title">([^<]*)/)?.[1] ?? ""),
      href: decode(e.match(/<a href="([^"]+)"/)?.[1] ?? ""),
      type: TYPES[sub] ?? (icon.startsWith("image/") ? "Image" : "Other"),
      thumb: e.match(/flip-entry-thumb"><img src="([^"]+)"/)?.[1],
      modified: e.match(/flip-entry-last-modified"><div>([^<]*)/)?.[1] ?? "",
    };
  });
}

export async function listDriveFiles() {
  const res = await fetch(`https://drive.google.com/embeddedfolderview?id=${FOLDER_ID}`);
  if (!res.ok) throw new Error(`Drive embed returned ${res.status}`);
  return parseDriveEmbed(await res.text());
}
