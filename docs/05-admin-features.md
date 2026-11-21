# Admin features

A tour of every screen: what it shows, how it filters, and what it writes. Each section names the
components involved so you can go straight to the code.

## Navigation

`app/admin/sidebar.tsx` holds a hardcoded list of six links:

| Label | Href | Notes |
|---|---|---|
| Overview | `/admin` | Active only on an exact match. |
| Documents | `/admin/documents` | |
| Members | `/admin/members` | |
| Deadlines | `/admin/deadlines` | |
| Applications | `/admin/applications` | Also active on `/admin/applications/*`, including detail pages and the questions editor. |
| Tools | `/admin/tools` | |

Active state is `pathname.startsWith(href)`, except for `/admin` which requires equality
(`app/admin/sidebar.tsx:55`). Below `md` the nav becomes a horizontally scrolling strip and the
logout button moves into the header; at `md` and up the sidebar is sticky, full height, with the
account block pinned to the bottom.

The sidebar renders inside `Suspense` with `SidebarView name="" email="" pathname=""` as fallback, so
the static shell is complete before the session lookup resolves.

## Overview — `/admin`

`app/admin/page.tsx`. The dashboard fetches all three data sources concurrently:

```ts
const [applications, deadlines, members] = await Promise.all([
  listApplications(), listDeadlines(), listMembers(),
]);
```

| Element | Content |
|---|---|
| Members stat | `members.length`, with "N executives" underneath (category === `"Executive"`). |
| Nearest deadline stat | First deadline whose status is not `Done`, already sorted by `due`. Shows "None / Nothing open" if exhausted. |
| Recent applications | First 5, newest first, linking to each detail page, with a status badge. |
| Upcoming deadlines | First 5 not-done deadlines, due date right-aligned. |
| Applications per department | Donut plus a legend that doubles as a table view. |

The donut gets one slice per department from `DEPARTMENTS`, in that fixed order, coloured from
`SERIES` (`app/admin/page.tsx:108`). Colours are assigned by index, so **adding a department shifts
every later colour** unless you extend the palette deliberately. Because counts are computed by
filtering the application list in memory, a department renamed in `lib/departments.ts` will silently
report zero until the forms data matches.

`Donut` (`app/admin/donut.tsx`) is a client component: one stroked `<circle>` per slice with a 2px
gap, a `strokeDasharray` computed from the slice's fraction of the total, and its own tooltip element
positioned from the pointer rather than an SVG `<title>` (instant hover). Slices with zero value are
omitted; a single remaining slice gets no gap.

## Documents — `/admin/documents`

`app/admin/documents/page.tsx`. Shows the contents of the CyberPH shared Google Drive folder, with a
"Open in Google Drive" action in the panel header.

- The folder is fixed in source: `FOLDER_ID` in `app/admin/documents/drive.ts:2`.
- There is no Drive API integration. `listDriveFiles()` fetches
  `https://drive.google.com/embeddedfolderview?id=<id>` and scrapes the public embed HTML.
- `parseDriveEmbed` maps Google MIME types to friendly labels (`Docs`, `Sheets`, `Slides`, `Forms`,
  `Folder`, `PDF`), falls back to `Image` for `image/*` icons, and `Other` otherwise.
- If the fetch throws — folder no longer link-shared, or the markup changed — the page shows
  "Could not load the Drive folder. Use Open in Google Drive." rather than failing the route.

`FileBrowser` adds client-side search by title, a type filter built from the data it received, and a
List/Grid toggle. Grid uses Drive's thumbnail URLs in a plain `<img>` (eslint-disable is deliberate;
configuring `next/image` for a scraped host is not worth it). Files open in a new tab.

Because the page scrapes HTML, changes to Google's embed markup are the most likely reason this
screen breaks. The upgrade path is the Drive API with an API key.

## Members — `/admin/members`

`app/admin/members/page.tsx` plus `members-table.tsx`.

**Adding** uses a single-row form: Name, Position, Department, College (optional), Category (select
from `MEMBER_CATEGORIES`). `addMember` (`app/admin/members/actions.ts:16-28`) validates the category
against the constant, trims every text field to 1-200 characters, stores a blank college as `NULL`,
and revalidates `/admin/members`.

**Browsing** is entirely client-side over the full list:

- Category chips: `All` plus the five categories, each with a count.
- Sort selector with three modes.

`rank()` (`app/admin/members/members-table.tsx:10-21`) is the interesting part. For executives it
infers seniority from the position text, because `position` is free text:

| Rank | Match |
|---|---|
| 0 | exactly `president` |
| 1 | contains `executive vice president`, or exactly `evp` |
| 2 | contains `chief of staff` |
| 3 | starts with `vp`, or `vice president` |
| 4 | starts with `avp`, or `assistant vice president` |
| 5 | any other executive |
| 6+ | non-executives, by index in `MEMBER_CATEGORIES` |

Ties break on name via `localeCompare`. Everything is case-insensitive and trimmed first, so
"Chief of Staff " and "chief of staff" agree.

There is **no edit and no delete** for members. A typo means a SQL update.

## Deadlines — `/admin/deadlines`

`app/admin/deadlines/page.tsx` plus `deadlines-table.tsx`.

**Adding** takes Task, Department (stored as `owner`), and Due (a `date` input). `addDeadline`
requires an ISO `YYYY-MM-DD` due date and 1-300 character text fields, then revalidates both
`/admin/deadlines` and `/admin`.

**Viewing** filters on two axes, both client-side:

| Filter | Values |
|---|---|
| Status | `Not done` (default), `All`, `Done` |
| Due | `Any date`, `Overdue`, `Next 7 days`, `Next 30 days`, `Later` |

"Today" is computed **on the server** as `new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" })`
(`app/admin/deadlines/page.tsx:46`) and passed down as a `YYYY-MM-DD` string. All day arithmetic is
then `Date.parse(due) - Date.parse(today)` divided by 86,400,000, which is time-zone-free because
both operands are bare dates. Doing this in the browser would let a user's clock disagree with the
dates rendered by `formatDate`, which is pinned to Asia/Manila.

Overdue rows get a red date; `Done` rows are struck through and dimmed. Status is changed in place by
an auto-submitting select whose `key={d.status}` forces a remount if the saved value changes
(`app/admin/deadlines/deadlines-table.tsx:85`).

Again: no delete, no edit of title/owner/date.

## Applications — `/admin/applications`

The section has a layout with a page header and two tabs (`app/admin/applications/layout.tsx`):

- **Applicants** → `/admin/applications`
- **Form questions** → `/admin/applications/questions`

Both tabs stay highlighted sensibly on detail pages: the tabs component treats any path other than
`/admin/applications/questions*` as "Applicants" (`tabs.tsx:21-22`).

### Applicant list

`app/admin/applications/page.tsx` renders four counters (all, pending, interview, accepted), a
per-department count table, and the table itself.

`ApplicantsTable` (`applicants-table.tsx`) holds three pieces of state: the status filter, the
department filter, and a `Set` of selected ids. Behaviour worth preserving:

- **Filter chips** are `all` plus `APPLICATION_STATUSES`, each with a count computed from the
  department-filtered list, ignoring the status filter.
- **Department filter** is a select built from `DEPARTMENTS`, matched on department name. Each
  option shows that department's total.
- **Position** shows the applicant's team underneath when the role has teams.
- **Refresh** calls `router.refresh()` to re-fetch applicants without a page reload. Filters and
  selection stay.
- **Row numbering** is `apps.length - apps.indexOf(a)`, i.e. numbered by submission order across all
  applicants with the newest highest — not 1..n per filtered view
  (`applicants-table.tsx:166`).
- **Select all** applies to the currently shown rows and toggles between "select all" and "clear
  those".
- **CSV export** exports the selection if there is one, otherwise everything currently shown. The
  count in the button label reflects which.
- **Whole row is clickable** via `RowLink`, which calls `router.push`. The name cell also contains a
  real `<Link>` for keyboard and screen-reader users, and the checkbox cell stops propagation so
  ticking a box does not navigate.
- **Status changes inline** through `ApplicationStatusSelect`, which stops click propagation and
  submits on change.
- **Small screens**: `#` hides below `sm`, Position below `md`, College and Submitted below `lg`.
  Hidden fields stack under the name instead. Toolbar buttons and the batch control go full width
  below `sm`.
- **Batch status**: with rows ticked, a "Mark N selected as [Choose status…]" control shows in the toolbar. Picking a status
  calls `setApplicationsStatus` for every selected row that is currently shown. Selection stays.

CSV generation lives in `csv.ts` and is worth knowing in detail:

- RFC 4180 quoting: cells containing `"`, `,`, `\r`, or `\n` are quoted with doubled quotes; rows are
  joined with CRLF.
- Formula injection guard: any cell starting with `=`, `+`, `-`, `@`, tab, or CR is prefixed with `'`
  so Excel and Sheets treat it as text. Applicant fields are untrusted input.
- The file is downloaded through a `Blob` with a UTF-8 BOM prepended, so Excel opens names with ñ
  and similar correctly.
- Columns include Team and Interview (Manila time, blank when no slot was booked).
- Filename is `applicants-YYYY-MM-DD.csv`. Dates in the "Submitted" column are
  `toISOString().slice(0, 10)` — UTC, unlike every date rendered in the UI.

### Applicant detail — `/admin/applications/[id]`

Two panels: answers on the left (two-thirds), personal information on the right.

- The `id` must match `/^\d+$/`, otherwise `notFound()`. A missing row also 404s.
- Personal info renders in a fixed order, with `PUP Webmail` spliced in second only when present.
- Link fields (Facebook, shared post, LinkedIn, valid ID) are opened via `safeUrl`, which only
  accepts `http:`/`https:`. A `javascript:` URL from an applicant renders as plain text.
- Answers are ordered by question position and preserve the wording they were answered under, even
  if the question was later deactivated.
- The header line is role · team · department; the booked interview time shows under the submit
  date when there is one.
- Status can be changed here too, using the same select.

### Form questions — `/admin/applications/questions`

This screen edits the live membership form. Changes take effect immediately; there is no draft.

1. **Personal information** — a read-only list of the eleven fields on the form's first step
   (`questions/page.tsx:10-22`), each marked Required or Optional. These live in the forms app's
   code, not in a database, so they cannot be edited here. The list must be updated by hand if that
   form changes.
2. **Accepting applications** — "N of 9 departments open", with `Open all` and `Close all` (the
   latter behind a confirm dialog).
3. **One panel per department** — the department description from `lib/departments.ts`, an
   `Open`/`Closed` badge, and a toggle. Closing a department removes it from the form's picker and
   makes it refuse submissions.
4. **One card per role** — every live role (retired roles, `category IS NULL`, are hidden), with its
   category, its teams, and "No interview" when it skips the scheduler. Roles with zero
   questions still show ("Applicants submit with no answers."). Each question shows an inline textarea editor, its answer count, `Remove`, and `Save`.
   A footer form adds a question to that role.

Editing semantics are covered in [Data model](04-data-model.md#the-question-versioning-rule):
changing the wording of an answered question deactivates the old row and inserts a new one. The page
says so in a banner.

`ConfirmButton` (`confirm-button.tsx`) is a submit button that calls `confirm()` first and can
override its form's action via `formAction` — that is how `Remove` sits inside the edit form without
submitting the edit.

## Tools — `/admin/tools`

A static card grid from `tools` in `app/admin/data.ts`. Each entry has `name`, `description`, and an
optional `repo` and `url`; `Open` and `Repository` only render when set. Today: Membership Forms
(repo only) and Mail (`mail.cyberph.org`, link only). Add new systems there.

## Neon health check — `/admin/neon-check`

Not in the sidebar; visit it directly. It returns JSON, not HTML:

```json
{ "ok": true, "results": [ { "name": "postgres", "ok": true, "detail": "…" } ] }
```

The four probes are described in [Infrastructure](07-infrastructure.md#the-health-check).

---

Next: [Server actions →](06-server-actions.md)
