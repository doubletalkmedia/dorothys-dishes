# Dorothy's Dishes — website

```
content.json       every word, show, photo and link on the site
images/            photos and logos
.pages.yml         tells the CMS what boxes to show you (don't edit)

index.html         main page          ─┐
booking.html       booking form        │ these read from content.json —
focus-group.html   naming study        │ don't edit them directly
donalds-donts.html Donald's Don'ts     │
lily-land.html     Lily Land           │ (unlinked; has a noindex tag)
site.js            builds the pages   ─┘
styles.css         colours, fonts, layout — ask before changing

preview.py         look at the site on your own machine
prep-photos.py     make new photos match the site
new-photos/        drop new photos here before running prep-photos.py
```

## Editing day to day

Once the GitHub and CMS setup below is done, go to **app.pagescms.org**, log in with
GitHub, and pick this repository. You get labelled boxes — Shows, Home page, The band,
Booking, the three joke pages, and Settings. Type, hit save, and the site updates
itself within a minute or two. No files, no uploads.

You can do this from a phone.

## One-time setup

### 1. Put the site on GitHub

1. Make a free account at github.com.
2. Click **New repository**. Name it `dorothys-dishes`. Public is recommended — it
   makes it much easier for Claude to look at your current site and help. There is
   nothing secret in these files.
3. On the empty repo page choose **uploading an existing file**, drag in everything
   from this folder, and commit.

Make sure `.pages.yml` uploads. Some systems hide files starting with a dot — on a
Mac press **Cmd+Shift+.** in Finder to show them.

### 2. Connect Cloudflare Pages

1. At dash.cloudflare.com go to **Workers & Pages → Create → Pages → Connect to Git**.
2. Pick the repository. Leave the build settings empty — there is nothing to build.
3. Deploy. You get an address ending in `.pages.dev` within a minute.
4. Under **Custom domains**, add your domain once the nameservers point at Cloudflare.

From now on, every change committed to GitHub deploys automatically.

### 3. Connect the CMS

1. Go to app.pagescms.org and sign in with GitHub.
2. Grant it access to this repository.
3. It reads `.pages.yml` and builds the editor. Nothing else to configure.

### 4. Connect the forms

The booking form and the Dish List both run through Formspree — free for 50
submissions a month.

1. Make an account at formspree.io.
2. Create a form called "Booking", copy its endpoint (it looks like
   `https://formspree.io/f/abcdwxyz`).
3. In the CMS open **Settings → Forms** and paste it into "Booking form endpoint".
4. Repeat for "Dish List".

Until those are filled in, each form shows a "message us on Facebook" button instead,
so nothing on the live site ever looks broken.

### 5. Set your domain for link previews

When someone texts your link, the preview card comes from tags in the raw HTML —
those crawlers don't run JavaScript, so this can't live in content.json.

Open each of the five `.html` files, find `REPLACE-WITH-YOUR-DOMAIN.com`, and replace
it with your real domain. Three occurrences per file. You can do this on github.com:
click the file, click the pencil, edit, commit.

Afterwards, text yourself the link and check Facebook's Sharing Debugger. Facebook
caches hard — if a fix doesn't show, hit "Scrape Again".

### 6. Bandsintown

Claim "Dorothy's Dishes" at artists.bandsintown.com and put your real dates there.
Then in the CMS, **Shows → Use Bandsintown instead of the list below** → on. The
hand-typed list is ignored from then on, and your dates appear on the site, Spotify,
Apple Music, Google and Shazam at once.

## Looking at it on your own computer

Double-clicking `index.html` no longer works. The site reads its words from
content.json, and browsers refuse to let a page opened off your hard drive read
another local file.

Instead: open Terminal, type `cd ` then drag this folder onto the window, press
Enter, and run:

```
python3 preview.py
```

Your browser opens the site. Edit, save, refresh. Ctrl+C to stop.

You mostly won't need this — Cloudflare builds a preview of every change, and the
CMS shows you what you're editing.

## Photos

Every band photo is black and white and resized. New ones need the same treatment or
they'll look wrong and slow the page down.

First time only: `python3 -m pip install pillow`

Then each time:

1. Put new photos in `new-photos/`.
2. Run `python3 prep-photos.py`.
3. It prints the new filenames. They land in `images/`, ready to pick in the CMS.

Flags: `--landscape` keeps muted colour (for the wide strips between sections),
`--color` leaves a photo alone apart from resizing.

**If you upload a photo through the CMS instead**, it goes up exactly as it is — full
colour, full size. Fine for a quick swap, wrong for the gallery. Run gallery photos
through the script.

**Gallery sizing.** Tall photos count as 2, the wide one counts as 2, normal counts
as 1. The grid fills cleanly when the total is a multiple of 3 — currently 3 tall +
1 wide + 7 normal = 15.

**Member photos.** Square, about 400px, black and white. Clearing the photo box puts
the initials circle back.

## The logo

Two versions, because the top bar changes colour as you scroll:

- `logo.svg` — dark, shown on the pale bar once scrolled
- `logo-reversed.svg` — light, shown on the rust bar at the top

Both are in **Settings → Logo**. If you replace them, keep the pairing — a dark logo
vanishes on rust and a light one vanishes on bone.

## Still marked for you

- **Tim's bio paragraph** — The band → Placeholder note. Clear the box to remove it.
- **Sample shows** — two rows in Shows. Replace or delete them.
- **Good to know** — empty on the Booking page. Add set length, PA situation, etc.
- **Donald's Don'ts** — three placeholder lines.
- **Contact link** — Settings → Contact link. Points at Facebook; switch to
  `mailto:...` when you have an address you want public.

## Known cosmetic issue

Lily Land has about 22px of sideways scroll on a phone, caused by the scrolling
ticker bar. Harmless, and easy to fix whenever you want it gone.

## Colours and structure

Colours live at the top of `styles.css` under `:root`. Section headings use the rust
(`--rust`); the menu stays dark. Ask before changing anything structural.
