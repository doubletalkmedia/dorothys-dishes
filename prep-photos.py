#!/usr/bin/env python3
"""
prep-photos.py — makes new photos match the site.

HOW TO USE
  1. Put new photos in the new-photos/ folder (next to this file).
  2. Open Terminal, drag this folder in after typing `cd `, press Enter.
  3. Run:   python3 prep-photos.py
  4. Finished photos land in images/, ready to reference in content.js.

  Band photos become black and white and get resized (that's the default).
  For a landscape you want to keep in muted color, run:
     python3 prep-photos.py --landscape
  For a photo you want left in full color (a logo, an album cover), run:
     python3 prep-photos.py --color

  Every photo in new-photos/ is processed the same way per run, so do
  band photos in one run and landscapes in another.

FIRST TIME ONLY
  This needs the Pillow library. In Terminal:   python3 -m pip install pillow
  If python3 isn't found on a Mac, run `xcode-select --install` first.
"""
import sys, os, re
try:
    from PIL import Image, ImageOps, ImageEnhance
except ImportError:
    sys.exit("Pillow isn't installed yet. Run:  python3 -m pip install pillow   and try again.")

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'new-photos')
OUT = os.path.join(HERE, 'images')
MODE = 'bw'
if '--landscape' in sys.argv: MODE = 'landscape'
if '--color' in sys.argv: MODE = 'color'
MAXW = 1600 if MODE == 'bw' else 2000
EXTS = ('.jpg', '.jpeg', '.png', '.heic', '.tif', '.tiff', '.webp')

def bw(im):
    g = ImageOps.grayscale(im)
    g = ImageOps.autocontrast(g, cutoff=0.3)
    g = ImageEnhance.Contrast(g).enhance(1.08)
    return g.convert('RGB')

def mute(im, sat=0.55, con=0.92, lift=14):
    im = ImageEnhance.Color(im).enhance(sat)
    im = ImageEnhance.Contrast(im).enhance(con)
    return im.point(lambda v: int(lift + v * (255 - lift) / 255))

def slug(name):
    base = os.path.splitext(name)[0].lower()
    base = re.sub(r'[^a-z0-9]+', '-', base).strip('-')
    return base or 'photo'

if not os.path.isdir(SRC):
    os.makedirs(SRC)
    sys.exit("Made a new-photos/ folder. Put photos in it and run this again.")
os.makedirs(OUT, exist_ok=True)

files = [f for f in sorted(os.listdir(SRC)) if f.lower().endswith(EXTS)]
if not files:
    sys.exit("No photos found in new-photos/.")

for f in files:
    path = os.path.join(SRC, f)
    try:
        im = Image.open(path)
        im = ImageOps.exif_transpose(im).convert('RGB')   # fix sideways phone photos
    except Exception as e:
        print('  skipped', f, '-', e); continue
    if MODE == 'bw': im = bw(im)
    elif MODE == 'landscape': im = mute(im)
    w, h = im.size
    if w > MAXW:
        im = im.resize((MAXW, int(h * MAXW / w)), Image.LANCZOS)
    dest = os.path.join(OUT, slug(f) + '.jpg')
    n = 2
    while os.path.exists(dest):
        dest = os.path.join(OUT, slug(f) + '-' + str(n) + '.jpg'); n += 1
    im.save(dest, 'JPEG', quality=82 if MODE != 'landscape' else 78, optimize=True, progressive=True)
    print('  ' + f + '  ->  images/' + os.path.basename(dest) + '  (' + str(im.size[0]) + 'x' + str(im.size[1]) + ')')

print("\nDone. Add the new file names to content.js, then re-upload the folder.")
print("The originals are still in new-photos/ — move them out when you're finished.")
