# Sonora Music Player

A responsive, browser-based music player with a searchable library, favorites, custom playlists, and local audio imports. Sonora uses plain HTML, CSS, and JavaScript; it has no build step or package dependencies.

## Run locally

Open `index.html` in a browser, or serve the project directory with a local HTTP server. For example, if Python is installed:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`. A local server is recommended for consistent audio and browser storage behavior.

## Features

- Play, pause, seek, and adjust volume.
- Search the library and switch between all songs, favorites, recently played, and custom playlists.
- Import multiple audio files from your device. Supported common formats include MP3, WAV, M4A, OGG, FLAC, and AAC.
- Create, rename, and delete playlists. Add songs to a playlist or remove them from it.
- Save favorites, playlists, playback settings, and recent tracks in browser storage.
- Use shuffle and cycle repeat between off, all, and one track.

Imported audio files are stored in this browser on this device using IndexedDB. Favorites, playlists, and playback settings use local storage. This data does not sync between devices and is cleared if the browser's site data is removed. Removing an imported song from Sonora does not delete its original file.

## Keyboard controls

- Focus the progress bar and use the arrow keys to seek by 5 seconds. Hold `Shift` to seek by 10 seconds. `Home` and `End` jump to the start and end.
- Use `Tab` and `Enter` or `Space` to navigate and activate player controls.

## Project structure

- `index.html` - player and library markup.
- `assets/css/style.css` - responsive styling.
- `assets/js/app.js` - playback, library, playlists, and browser storage.
- `music/` - bundled audio tracks.
- `img/` - bundled album covers.

To add bundled tracks, put the audio file in `music/`, add its title and filename to `bundledTracks` in `assets/js/app.js`, and add the matching cover image in `img/`.
