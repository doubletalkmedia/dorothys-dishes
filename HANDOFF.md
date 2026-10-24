# Dorothy's Dishes website — handoff for a new Claude conversation

**Read this first if you are a new assistant picking up this project.**
Everything you need is in this repository. Nothing is tied to the conversation
that built the site.

Last verified: 24 October 2026. Domain connected and link-preview placeholders filled that day.

---

## 1. What exists and where

| Thing | Where | Status |
|---|---|---|
| Source of truth | `github.com/doubletalkmedia/dorothys-dishes` (public, branch `main`) | live |
| Live site | `dorothysdishes.com` and `www.dorothysdishes.com` (the old `danielpetersen.doubletalkmedia.workers.dev` address still works) | live |
| Host | Cloudflare — a **Worker**, not Pages (Cloudflare merged the two; static sites now deploy as Workers) | connected to the repo |
| CMS | `app.pagescms.org`, config in `.pages.yml` | configured, not yet exercised |
| Domain | `dorothysdishes.com`, registered at **GoDaddy** in Tim McCarty's account (Dan has access). Nameservers point at Cloudflare; both the bare domain and `www` are Custom Domains on the Worker | live |
| Forms | Formspree | account not created |
| Tour dates | Bandsintown | account not created |

**Deploy loop:** commit to `main` → Cloudflare rebuilds automatically → live in ~1 minute.
There is no build step. The files are served as-is.

---

## 2. Working with the site owner

Dan Petersen maintains this site. Explain web tooling plainly rather than
assuming familiarity with it — he works in a text editor, not a terminal.

**Make no design, structural, formatting, aesthetic or font change unless it
was asked for.** Raise suggestions and let him decide. Don't quietly improve
things.

---

## 3. How the site is built

Deliberately plain: HTML, CSS, one JS file. No framework, no build, no npm.

```
content.json        ← ALL words, shows, photos, links. The only content file.
site.js             ← fetches content.json, renders every page. Don't put content here.
styles.css          ← colours, type, layout
.pages.yml          ← CMS field definitions (must stay in sync with content.json)

index.html          main page
booking.html        booking form
focus-group.html    "naming study" joke page
donalds-donts.html  joke page (stub)
lily-land.html      not in the nav; carries a noindex tag. Leave both as-is.

images/             32 files — band photos, landscapes, two logos, social card
preview.py          local preview server (see §6)
prep-photos.py      image processor (see §5)
```

`site.js` reads `content.json` at runtime with `fetch()`. Each HTML file is a
skeleton of empty `<section>` tags that `site.js` fills.

---

## 4. Design decisions — do not undo these by accident

**Palette** (top of `styles.css`, `:root`):

```
--bone        #EFEAE0   page background
--bone-deep   #E4DDCF
--wheat       #C7B584   hairlines, footer text
--sage        #7F8A73   italic labels
--sky         #9DB1BA   input placeholders only
--umber       #2E261F   body text, menu, footer background
--umber-soft  #5A4F44   secondary text
--rust        #9E3F2B   section headings, primary button, at-top header
```

Derived from a western Nebraska landscape photo. Deliberately **not** Arizona
red — the band is from Lincoln and the brief was explicit about avoiding
borrowed southwestern scenery. Band photos are black and white; the muted
landscape strips are the only colour imagery.

**Fonts:** Barlow Condensed (display) + Lora (body) on the main site.
Lily Land uses League Spartan (lowercase masthead) + DM Sans (caps labels),
also Google Fonts. DM Sans stands in for TT Fors, which is a paid TypeType
release and would need a webfont licence.

**Wordmark sizing:** `--wordmark-fill` in `styles.css` controls how much of the
column the hero wordmark fills. `.74` on desktop (≥900px), `1` on mobile.
`site.js` reads this value. Change the number, not the code. Sensible range
.68–.80.

**Header inversion:** at the top of any page the bar is rust with the light
logo; past 12px of scroll it crossfades to bone with the dark logo, over
0.22s. Driven by the `.at-top` class, toggled in `site.js`.

**Two logos are mandatory.** `logo.svg` (dark) vanishes on rust; `logo-reversed.svg`
(light) vanishes on bone. Both are loaded and crossfaded. Never reduce to one.

**Hero photo** is cropped to the top 66.4% of the original. This framing was
chosen deliberately — do not re-crop it without asking. Mobile shows it at
16:9 and trims the sides, never the top or bottom, so the framing is preserved
at every width.

**Member photos** were cropped with face detection to one consistent rule:
face box = 35% of frame width, face centre at 42% of frame height. If you
re-crop one, match that or they stop looking like a set.

**Social preview tags live in the raw HTML of all five pages, not in
content.json.** Social crawlers don't run JavaScript. Leave them there.

---

## 5. Photos

`prep-photos.py` converts band photos to black and white and resizes them.
Drop originals in `new-photos/`, run `python3 prep-photos.py`, output lands in
`images/`. Flags: `--landscape` (muted colour, for the wide strips),
`--color` (resize only).

**Photos uploaded through the CMS skip this step** — they go up full colour at
full resolution. Fine for a one-off swap; wrong for the gallery.

**Gallery grid:** tall counts as 2, wide counts as 2, normal counts as 1.
Fills cleanly when the total is a multiple of 3. Currently 3 tall + 1 wide +
7 normal = 15.

---

## 6. Previewing locally

Double-clicking `index.html` **does not work** — browsers block a `file://`
page from reading `content.json`. The page shows an explanatory message
instead of the site. This is expected, not a bug.

Run `python3 preview.py`. It serves the folder, opens a browser, and validates
`content.json` first, naming the line number if it's malformed.

---

## 7. The CMS

`.pages.yml` defines eight editor screens: Shows, Home page, The band, Booking
page, Donald's Don'ts, Lily Land, Naming study, Settings.

**`settings.content.merge: true` is load-bearing.** All eight screens write to
the same `content.json`. Without merge, saving one screen deletes the keys
owned by the others. Do not remove it.

Any new field must be added to **both** `.pages.yml` and `content.json`, with
matching shape, or the CMS will silently drop it.

---

## 8. How changes actually get made

**You cannot commit to this repository.** There is no GitHub connector and
`gh api` is blocked for this repo. The working loop is:

1. You produce the changed file(s).
2. He commits them via github.com (click file → pencil → paste → commit),
   or uploads them.
3. Cloudflare redeploys automatically.

**You can read the repo** over `https://raw.githubusercontent.com/doubletalkmedia/dorothys-dishes/main/<path>` —
it is public, and this works without any connector. Use it to see the current
live state before changing anything. Verify your assumptions this way rather
than trusting a stale copy.

**When Claude in Chrome is connected** (the browser extension in Dan's Chrome),
you can make the commit yourself through github.com's upload page, but only
after he says to. Show him the change first, upload, commit, then check the
live site.

**You can read the live site** with a web fetch, but only once the URL has been
pasted into the conversation (a permission requirement).

**Sandbox limits:** no access to Google Fonts, YouTube, Spotify or `pages.dev`
from the container. GitHub and `raw.githubusercontent.com` are reachable.
This means fonts, videos and the Spotify player appear broken in any local
screenshot and are fine in reality. Don't report them as faults.

---

## 9. Outstanding work

Nothing below is broken — these are unfinished setup steps.

**Domain renewal** — `dorothysdishes.com` expires 31 January 2027. Auto-renew
has not been confirmed. If it lapses, the site address goes down with it.
(The domain and the 20 link-preview placeholders were done on 24 October 2026.
Tim also owns `dorothysdishesband.com`; it is unused and deliberately left off
Cloudflare. Tim's other domains in that GoDaddy account are not band business.
Leave them alone.)

**Formspree** — `forms.bookingEndpoint` and `forms.dishListEndpoint` in
content.json are both empty. Until filled, both forms show a "message us on
Facebook" button instead, so nothing looks broken on the live site. Free tier
is 50 submissions/month.

**Bandsintown** — not set up. Once dates are entered there, flip
`shows.useBandsintown` to `true` and the hand-typed list is ignored.
Order matters: enter real dates first, or the Shows section goes empty.
`shows.bandsintownArtistName` must match the Bandsintown page exactly.

**Sample shows** — two rows reading "Sample venue name" are still live, and
both dates (3 and 17 October 2026) have now passed. They should be replaced or
deleted before the site is shared widely.

**Bio paragraph** — `band.placeholder` holds a bracketed italic note marking
where a further paragraph will go. Clearing the field removes it.

**Donald's Don'ts** — three bracketed placeholder lines, content not written.

**Lily Land sticker** — the sticker footnote and the matching feature text no
longer agree after an edit. Flagged, no decision yet.

**Member photo brightness** — the six circles vary in brightness because the
source photos were taken in different lighting. An evened set was prepared and
offered; the current files are the un-evened version, pending a decision.

**Lily Land mobile overflow** — ~22px of horizontal scroll on a phone, caused
by the scrolling ticker. Pre-existing, cosmetic, one-line fix available.

**Members portal (planned, not built)** — a private, members-only section of
the site. Mockup approved 18 October 2026. It is a clickable phone prototype on
a design canvas that is private to Dan. Decisions so far:
- Sign-in is Cloudflare Access with an emailed one-time code: no passwords, no
  accounts, signed in for 30 days. The repo stays public; band data lives in a
  Cloudflare D1 database, never in the repo.
- One person = one identity. A member can have several sign-in emails, and
  every action is recorded under their name. Dan is the only admin and is
  the only one who can add members or emails.
- Every member can add and edit. A small activity line in the feed shows who
  did what.
- The portal is the calendar. Events (shows, rehearsals, other) carry venue,
  map link, times, arrival notes, Bandsintown link, setlist, gear checklist,
  who's playing and questions. Members subscribe once from Google, Apple or
  Outlook; the sync delay of those apps is accepted.
- Features: a band feed (posts, files, links, @mentions, event cards), a
  Doodle-style availability poll that books the winning date, a files library
  (newest first, sortable, searchable by name), search across posts, files and
  events, two buttons to the Google Photos album (view / add), and Venmo pay
  and split-a-cost links.
- Email notifications are manual only. The poster ticks who to notify, and
  nobody is emailed by default. Sent free through Cloudflare Email Routing to
  verified member addresses.
- Not possible: mirroring the band's text thread, or embedding the Google
  Photos album (Google closed that in 2025).
- Build order: sign-in, members, feed, events and calendar first; then polls,
  files, search, payments.

---

## 10. Things that have already gone wrong

**Dotfiles don't upload from Finder.** `.pages.yml` silently failed to upload
and the CMS wouldn't have worked. Fix: upload it named without the dot, then
rename it on github.com (the filename field in the editor). Finder's
Cmd+Shift+period shows hidden files.

**An empty GitHub repo hides the upload link.** It's the small "uploading an
existing file" text on the setup screen, easy to miss.

**Full-page screenshots misplace sticky headers.** The nav bar appears
mid-page in stitched screenshots. It's a capture artifact — verify position
with a scroll-state check, not a screenshot.

**Scoped CSS leaks between pages in the preview build.** A per-page `:root`
block overrode the main site's font variables. Only affected the combined
preview file, not the real site.

---

## 11. Verifying your work

Checked claims are valued over confident ones. Before reporting something
fixed:

- Diff against the live repo rather than a local copy.
- Render and look at it, don't assume.
- When a choice is subjective (a crop, a proportion, a font), render two or
  three options and let him choose. This has worked well repeatedly.
- Say plainly what you changed that he didn't ask for, if anything.
