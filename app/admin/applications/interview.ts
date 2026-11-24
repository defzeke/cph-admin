export const INTERVIEW_VIEWS = {
  any: "Any interview",
  earliest: "Interview: earliest first",
  latest: "Interview: latest first",
  today: "Interview today",
  upcoming: "Upcoming interviews",
  past: "Past interviews",
  none: "No interview booked",
} as const;

export type InterviewView = keyof typeof INTERVIEW_VIEWS;

const manilaDay = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });

// "today" is the Manila calendar day, same as every date shown in the UI.
export function byInterview<T extends { interview_at: Date | string | null }>(apps: T[], view: InterviewView, now: Date) {
  if (view === "any") return apps;
  if (view === "none") return apps.filter((a) => !a.interview_at);
  const time = (a: T) => new Date(a.interview_at!).getTime();
  const kept =
    view === "earliest" || view === "latest"
      ? apps
      : apps.filter((a) => {
          if (!a.interview_at) return false;
          if (view === "today") return manilaDay(new Date(a.interview_at)) === manilaDay(now);
          return view === "upcoming" ? time(a) >= now.getTime() : time(a) < now.getTime();
        });
  const desc = view === "latest" || view === "past";
  return [...kept].sort((a, b) => {
    // unbooked always last
    if (!a.interview_at || !b.interview_at) return Number(!a.interview_at) - Number(!b.interview_at);
    return desc ? time(b) - time(a) : time(a) - time(b);
  });
}
