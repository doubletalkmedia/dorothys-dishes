#!/usr/bin/env python3
"""
preview.py — look at the site on your own machine before you upload it.

WHY THIS EXISTS
  The site now reads its words from content.json. Browsers refuse to let a page
  opened straight off your hard drive read another local file, so double-clicking
  index.html shows an error instead of the site. This script serves the folder
  over a real (local-only) address, which browsers are happy with.

HOW TO USE
  1. Open Terminal.
  2. Type  cd  followed by a space, drag this folder onto the window, press Enter.
  3. Run:   python3 preview.py
  4. Your browser opens the site. Leave the terminal window open while you work.
  5. Edit content.json, save, and refresh the browser to see the change.
  6. Press Ctrl+C in the terminal when you're finished.

Nothing here is uploaded and nobody else can reach it — the address only works
on this computer.
"""
import http.server, socketserver, webbrowser, os, sys, threading, json

PORT = 8000
HERE = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=HERE, **kw)

    def end_headers(self):
        # Never cache, so a refresh always shows your latest edit.
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()

    def log_message(self, fmt, *args):
        pass  # keep the terminal quiet


def check_content():
    """Catch a broken content.json before the browser does."""
    path = os.path.join(HERE, 'content.json')
    if not os.path.exists(path):
        print("  !  content.json is missing from this folder.")
        return False
    try:
        with open(path, encoding='utf-8') as fh:
            json.load(fh)
        return True
    except json.JSONDecodeError as e:
        print("  !  content.json has a typo and the site will not load.")
        print(f"     Line {e.lineno}, column {e.colno}: {e.msg}")
        print("     Usually a missing comma, or a quote that was never closed.")
        return False


def main():
    ok = check_content()
    port = PORT
    for attempt in range(20):
        try:
            socketserver.TCPServer.allow_reuse_address = True
            httpd = socketserver.TCPServer(("127.0.0.1", port), Handler)
            break
        except OSError:
            port += 1
    else:
        sys.exit("Could not find a free port. Close other previews and try again.")

    url = f"http://localhost:{port}/index.html"
    print()
    print("  Dorothy's Dishes — local preview")
    print(f"  {url}")
    if not ok:
        print("  (fix content.json, then refresh the browser)")
    print("  Press Ctrl+C to stop.")
    print()
    threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n  Preview stopped.\n")
        httpd.server_close()


if __name__ == '__main__':
    main()
