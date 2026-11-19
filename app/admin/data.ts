// Systems built for CyberPH. Add new ones here; `url` is the live site once deployed.
export const tools: { name: string; description: string; repo: string; url?: string }[] = [
  {
    name: "Membership Forms",
    description: "Member and officer registration, with department picks and screening questions per role.",
    repo: "https://github.com/defzeke/cph-membership-forms",
  },
];

const dateFormat = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" });
export const formatDate = (date: string | Date) => dateFormat.format(new Date(date));

const dateTimeFormat = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" });
export const formatDateTime = (date: string | Date) => dateTimeFormat.format(new Date(date));
