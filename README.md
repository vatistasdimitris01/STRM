# SNATCH

<img src="./downloads/ascii-art-text.png" alt="SNATCH" width="400">

snatch any video. paste. snatch. done.

Download videos from YouTube, X/Twitter, Instagram, Threads, TikTok and
1,800+ other sites — right from your terminal. Paste a URL, pick a
resolution (or audio-only mp3), done. No popups, no fake download buttons,
no sketchy redirects.

## Install

```sh
npm install -g snatch-cli
```

Or try it without installing anything:

```sh
npx snatch-cli
```

Requires Node 18+. Everything else (yt-dlp, ffmpeg) is fetched or bundled
automatically.

## Usage

```sh
$ snatch https://youtu.be/dQw4w9WgXcQ    # straight to the format picker
$ snatch                                 # prompts for a URL
$ snatch --theme light                   # force the light palette
```

SNATCH takes over the terminal (full-screen, centered — and restores your
scrollback on exit). Pick a format with ↑/↓ (or j/k, or number keys) and
hit enter. `esc` goes back, `^c` quits. Or just use the mouse — the snatch
button, the format list and the footer hints are all clickable, and
clicking the logo takes you back home. Files are saved to `~/Downloads`,
and the file path is printed to your terminal when you're done.

The default `auto` theme uses your terminal's own foreground and background,
so it follows light and dark terminal themes without guessing. Press `^t` or
click the theme control in the footer to cycle through `auto`, `light`, and
`dark` for the current session. Use `--theme auto`, `--theme light`, or
`--theme dark` to set the default for the run.

## Features

- **1800+ sites** — YouTube, X, Instagram, Threads, TikTok, Reddit, Vimeo,
  Twitch, Bilibili, and thousands more via yt-dlp
- **Audio-only** — extract mp3 or best audio with one pick
- **Terminal themes** — auto, light, and dark palettes that respect your
  terminal
- **Mouse + keyboard** — fully navigable with arrow keys, vim keys, number
  keys, or mouse clicks
- **Clipboard aware** — detects URLs in your clipboard and offers to paste
- **History** — remembers your recent URLs for quick re-downloads

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `↑` / `↓` | Navigate format list |
| `↵` | Select / confirm |
| `esc` | Go back / cancel |
| `^t` | Cycle theme |
| `^c` | Quit |

## Configuration

- **yt-dlp binary** — auto-downloaded to `~/.snatch/bin/` on first run
- **History** — stored at `~/.config/snatch/history.json`
- **Downloads** — saved to `~/Downloads` by default

## Author

**Dimitris Vatistas**
- Website: [dvatistas.vercel.app](https://dvatistas.vercel.app)
- GitHub: [@vatistasdimitris01](https://github.com/vatistasdimitris01)

## License

MIT
