# Music Player

A small, responsive browser-based music player with a bundled six-track playlist. It is built with plain HTML, CSS, and JavaScript and has no build step or package dependencies.

## Run locally

Open `index.html` in a browser, or serve the project directory with a local HTTP server. For example, if Python is installed:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`. Serving the files over HTTP is recommended because browser audio behavior can vary when pages are opened directly from disk.

## Player controls

- Play or pause the current track.
- Skip to the next or previous track. The playlist wraps at either end and advances automatically when a track finishes.
- Click or focus the progress bar to seek. With the bar focused, use the arrow keys to move by 5 seconds, `Shift` plus an arrow key to move by 10 seconds, or `Home` and `End` to jump to the beginning and end.
- Adjust the volume with the slider or mute and restore it with the speaker button.

## Project structure

- `index.html` - player markup and local stylesheet references.
- `assets/css/style.css` - player layout and responsive styles.
- `assets/js/app.js` - playlist, playback, seeking, and volume controls.
- `music/` - audio tracks used by the playlist.
- `img/` - album covers, in playlist order.

To change the playlist, update the `songs` array in `assets/js/app.js` and keep each audio filename and cover filename in sync with the files in `music/` and `img/`.
