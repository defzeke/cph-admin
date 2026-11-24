# Design system

The console reuses the CyberPH brand theme from the membership-forms site, minus its banners. This
page lists the tokens, the shared components, and the patterns the existing screens follow.

## Where things live

| Concern | File |
|---|---|
| Theme tokens, page background, watermark, top rule | `app/globals.css` |
| Fonts | `app/layout.tsx` (Geist + Geist Mono via `next/font`) |
| Page header, panel, status badge, table cell classes | `app/admin/ui.tsx` |
| Inline icon set | `app/admin/icons.tsx` |
| Date formatting | `app/admin/data.ts:10-11` |

## Colour tokens

Tailwind 4 theme variables are declared in `@theme inline` (`app/globals.css:9-26`), which exposes
them as utilities such as `bg-brand-600`.

| Token | Value | Used for |
|---|---|---|
| `brand-50` | `#fbf4e2` | Cream. Page titles, text on charcoal, active nav background. |
| `brand-100` | `#f2e0b8` | Card borders. |
| `brand-200` | `#dfb765` | Warm accents, pending badges. |
| `brand-500` | `#4a6cbd` | Logo blue: focus rings, links, hover borders. |
| `brand-600` | `#3b5ba9` | Primary buttons. |
| `brand-700` | `#2e4785` | Link text, button hover. |
| `gold` | `#d6a33c` | Reserved for the tri-colour rule. |
| `crimson` | `#b22234` | Destructive actions ("Close all"). |
| `sidebar` | `#303030` | Sidebar background, one step lighter than the page. |
| `background` | `#242424` | Charcoal page background. |

The palette is intentionally split: **50-200 are cream/gold** (light surfaces, borders, text on dark),
**500-700 are the logo blue** (interactive elements). Slate greys handle body text and table
structure; rose, emerald, amber, sky, violet, and teal appear only inside status badges.

## Surfaces and chrome

The global background is charcoal with a faint dot grid (`radial-gradient` at 7% cream opacity,
24px pitch, fixed attachment). Two pseudo-elements add brand furniture:

- `body::before` — a 4px fixed bar at the top, split 60% blue / 20% gold / 20% crimson
  (`globals.css:54-62`).
- `body::after` — a large chevron watermark from the logo at 4% opacity, anchored bottom-left and
  pushed partly off-screen (`globals.css:41-51`).

Both are `pointer-events: none` and `z-index`-managed so they never intercept clicks. Panels sit on
top as near-opaque white cards (`bg-white/95`) with a heavy shadow, which is what makes them read as
floating over the charcoal.

> The theme file sets `font-family: Arial, Helvetica, sans-serif` on `body`, but the admin shell and
> the login card both apply Tailwind's `font-sans`, which resolves to Geist via
> `--font-geist-sans`. The literal Arial is a leftover from matching the forms site; anything that
> forgets `font-sans` renders in Arial.

## Typography

- Titles: `text-2xl sm:text-3xl font-semibold tracking-tight` in cream.
- Panel headings: `text-base font-semibold` in slate-900.
- Body and table text: `text-sm`.
- Metadata, hints, counts: `text-xs` in slate-500.
- Numbers that can change width use `tabular-nums` everywhere — stat values, counts, dates, table
  numbering.

## Shared components — `app/admin/ui.tsx`

```tsx
<PageHeader title="Members" description="Executives, consultants, leads, …" />
<Panel title="Add member" action={{ href: "/admin/members", label: "View all" }}>…</Panel>
<Status value="pending" />
```

| Component | Contract |
|---|---|
| `PageHeader` | `title` + `description`, rendered as `<header>` with an `<h1>`. The description is secondary and lighter. |
| `Panel` | White card. Optional `title` (any node), optional `action` (`{ href, label }` rendered as a right-aligned link), optional `className` for margins/spans. |
| `Status` | Capitalises the first character and maps the label to a badge style. Unknown values fall back to the `Planned` style. |
| `th` / `td` | Exported class strings, not components. `td` fixes row height at `h-12` so side-by-side tables stay level. |

### Status badge palette

Keyed by the capitalised value (`app/admin/ui.tsx:42-59`):

| Value | Look |
|---|---|
| `Pending`, `Open` | Cream background, gold border, amber text |
| `Interview`, `In Progress`, `Ongoing`, `Lead` | Blue-tinted |
| `Under review` | Sky |
| `Accepted` | Emerald |
| `Declined` | Rose |
| `Closed`, `Done` | Neutral slate |
| `Executive` | Amber |
| `Ambassador` | Sky |
| `Chapter Lead` | Violet |
| `Consultant` | Teal |
| `Member`, `Planned` | White / slate (fallbacks) |

`Member`, `Planned`, and `Ongoing` are no longer produced by any current value list; they remain
because `Planned` is the unknown-value fallback.

## Tables

Tables are plain `<table>` elements styled with `th`/`td`. The recurring wrapper is:

```tsx
<div className="-mx-3 overflow-x-auto">
  <table className="w-full text-sm"> … </table>
</div>
```

The negative margin buys back the panel's padding so the scroll area runs to the card edge on narrow
screens. No table has a fixed layout; cells that must not wrap use `whitespace-nowrap`, and the one
column allowed to shrink uses `w-full max-w-0 truncate` with a `title` attribute
(`app/admin/page.tsx:78`).

## Filter and control patterns

Three control idioms repeat; copy them rather than inventing new ones:

1. **Filter chips** — pill buttons with `aria-pressed`, dark slate when active
   (`members-table.tsx:40-53`). Each chip shows a count in
   `tabular-nums opacity-60`.
2. **Segmented control** — a bordered inline-flex group for two or three exclusive options, used for
   status (deadlines) and List/Grid (documents).
3. **Auto-submitting select** — a `<select>` inside a `<form action={serverAction}>` that submits on
   `change`, keyed by its current value so a server-driven change remounts it.

Primary buttons are `rounded-md bg-brand-600 text-white hover:bg-brand-700`; secondary buttons are
white with a slate border that turns blue on hover; destructive ones use `bg-crimson`.

## Forms

- Every input is labelled by wrapping it in `<label>` or with `htmlFor`, and uses the same string of
  classes: white background, slate border, blue focus border, `disabled:opacity-*` on submit
  buttons.
- Password fields get a Show/Hide toggle (`login-form.tsx:29-35`).
- `ConfirmButton` wraps destructive submits and calls `confirm()` before allowing the submit; it
  takes `formAction` so a Remove button can live inside an edit form without triggering the edit.
- Server Action errors are not surfaced in the UI — see [Server actions](06-server-actions.md#error-handling).

## Icons

`app/admin/icons.tsx` defines seven inline SVGs behind one `Icon` wrapper: 24×24 viewBox, no fill,
`stroke="currentColor"`, `strokeWidth={1.8}`, round caps, `aria-hidden`, and an 18px default size.
Exports: `OverviewIcon`, `DeadlinesIcon`, `ApplicationsIcon`, `MembersIcon`, `DocumentsIcon`,
`ToolsIcon`, `LogoutIcon`.

Colour comes from the parent (`text-brand-600` when its nav item is active), so icons never need a
variant. Add new icons by extending the same wrapper.

## Logo assets

`public/cyberph/` holds the brand kit: `mark.png` (square mark, used in the sidebar and login card),
`logo.png`, `lockup.png`, and header/footer exports at 1x and 2x. Only `mark.png` is referenced by
the app, always through `next/image` with explicit width and height.

## Responsive behaviour

| Breakpoint | Change |
|---|---|
| base | Sidebar becomes a top strip; nav scrolls horizontally; logout sits in the header; tables scroll. |
| `sm` | Two-column stat grids; login card padding grows. |
| `md` | Sidebar becomes a sticky 256px column; logout moves to the account block; panel grids go side by side. |
| `lg` | Content max width 6xl with wider padding; three-column detail layout. |
| `xl` | Overview's two panels sit side by side. |

The shell is `flex min-h-screen flex-col md:flex-row` with `min-w-0 flex-1` on the content column —
without `min-w-0`, wide tables would push the sidebar off-screen.

## Accessibility notes

Already handled: `aria-current="page"` on active nav links and tabs, `aria-pressed` on filter chips,
`aria-label` on icon-only buttons and selects, `role="group"` on button clusters, `role="alert"` for
the login error, `role="status"` for sign-up success, `role="tooltip"` on the donut tooltip,
`title` on truncated cells, real `<Link>` inside clickable rows for keyboard users, and
`aria-hidden` on decorative SVGs.

Not handled: the clickable table row is mouse-only (the link inside is the keyboard path), the
donut is not focusable, and no page has a skip link. Keep those in mind when extending.

---

Next: [Conventions and gotchas →](09-conventions-and-gotchas.md)
