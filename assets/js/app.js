const audio = document.getElementById('audio');
const player = document.getElementById('music-container');
const title = document.getElementById('title');
const playButton = document.getElementById('play');
const previousButton = document.getElementById('prev');
const nextButton = document.getElementById('next');
const currentFavoriteButton = document.getElementById('current-favorite');
const shuffleButton = document.getElementById('shuffle');
const repeatButton = document.getElementById('repeat');
const repeatLabel = document.getElementById('repeat-label');
const seekBar = document.getElementById('progress-container');
const progress = document.getElementById('progress');
const progressCircle = document.querySelector('.circle');
const currentTimeLabel = document.getElementById('currTime');
const durationLabel = document.getElementById('durTime');
const volumeSlider = document.getElementById('volume');
const volumeButton = document.getElementById('volume-icon');
const volumeValue = document.getElementById('volume-value');
const coverImage = document.getElementById('cover-image');
const coverPlaceholder = document.getElementById('cover-placeholder');
const trackList = document.getElementById('track-list');
const libraryTabs = document.getElementById('library-tabs');
const playlistTabs = document.getElementById('playlist-tabs');
const librarySearch = document.getElementById('library-search');
const libraryMessage = document.getElementById('library-message');
const libraryCount = document.getElementById('library-count');
const headerTrackCount = document.getElementById('header-track-count');
const playlistTarget = document.getElementById('playlist-target');
const importInput = document.getElementById('audio-import');
const playlistDialog = document.getElementById('playlist-dialog');
const playlistForm = document.getElementById('playlist-form');
const playlistNameInput = document.getElementById('playlist-name');
const playlistDialogTitle = document.getElementById('playlist-dialog-title');
const STORAGE_KEY = 'sonora-v2-library';
const DATABASE_NAME = 'sonora-audio-library';
const DATABASE_VERSION = 1;

const bundledTracks = [
  { id: 'bundled-koohe-ghaf', title: 'Koohe Ghaf', file: 'Koohe Ghaf.mp3', cover: './img/Koohe-Ghaf.jpg' },
  { id: 'bundled-eshghemoon', title: 'Eshghemoon', file: 'Eshghemoon.mp3', cover: './img/Eshghemoon.jpg' },
  { id: 'bundled-emperatoore-divooneha', title: 'Emperatoore Divooneha', file: 'Emperatoore Divooneha.mp3', cover: './img/Emperatoore-Divooneha.jpg' },
  { id: 'bundled-baladam-boodi', title: 'Baladam Boodi', file: 'Baladam Boodi.mp3', cover: './img/Baladam-Boodi.jpg' },
  { id: 'bundled-2ta-cheshat', title: '2ta Cheshat', file: '2ta Cheshat.mp3', cover: './img/2ta-Cheshat.jpg' },
  { id: 'bundled-rasti-rasti', title: 'Rasti Rasti', file: 'Rasti Rasti.mp3', cover: './img/Rasti-Rasti.jpg' },
];

let importedTracks = [];
let favorites = new Set();
let playlists = [];
let recentIds = [];
let activeView = 'all';
let currentTrackId = null;
let currentQueue = [];
let shuffleEnabled = false;
let repeatMode = 'off';
let previousVolume = 1;
let editingPlaylistId = null;
let database = null;
let libraryMessageTimer = 0;
const objectUrls = new Map();

function allTracks() {
  return [...bundledTracks, ...importedTracks];
}

function getTrack(id) {
  return allTracks().find((track) => track.id === id);
}

function createId(prefix) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
}

function readSavedState() {
  try {
    const state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return state && typeof state === 'object' ? state : {};
  } catch {
    return {};
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      favorites: [...favorites],
      playlists,
      recentIds,
      activeTrackId: currentTrackId,
      activeView,
      shuffleEnabled,
      repeatMode,
      volume: audio.volume,
    }));
  } catch {
    showLibraryMessage('Your browser could not save library settings.');
  }
}

function showLibraryMessage(message, timeout = 4500) {
  clearTimeout(libraryMessageTimer);
  libraryMessage.textContent = message;
  libraryMessage.hidden = false;
  if (timeout) {
    libraryMessageTimer = window.setTimeout(() => {
      libraryMessage.hidden = true;
    }, timeout);
  }
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is not available in this browser.'));
      return;
    }
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('tracks')) {
        request.result.createObjectStore('tracks', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open local music storage.'));
  });
}

function readImportedTracks() {
  return new Promise((resolve, reject) => {
    if (!database) return resolve([]);
    const request = database.transaction('tracks', 'readonly').objectStore('tracks').getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error || new Error('Could not read imported tracks.'));
  });
}

function writeImportedTracks(records) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('tracks', 'readwrite');
    const store = transaction.objectStore('tracks');
    records.forEach((record) => store.put(record));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Could not save imported tracks.'));
    transaction.onabort = () => reject(transaction.error || new Error('Import was canceled.'));
  });
}

function deleteImportedTrack(id) {
  return new Promise((resolve, reject) => {
    if (!database) return resolve();
    const transaction = database.transaction('tracks', 'readwrite');
    transaction.objectStore('tracks').delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('Could not remove imported track.'));
  });
}

function getTrackSource(track) {
  if (track.file && !track.blob) return `./music/${encodeURIComponent(track.file)}`;
  if (!objectUrls.has(track.id)) objectUrls.set(track.id, URL.createObjectURL(track.blob));
  return objectUrls.get(track.id);
}

function updatePlaybackState() {
  const playing = !audio.paused && !audio.ended;
  player.classList.toggle('play', playing);
  playButton.innerHTML = `<i class="fas fa-${playing ? 'pause' : 'play'}" aria-hidden="true"></i>`;
  playButton.setAttribute('aria-label', playing ? 'Pause' : 'Play');
  renderLibrary();
}

function updateFavoriteButton(button, isFavorite, label) {
  button.classList.toggle('is-favorite', isFavorite);
  button.setAttribute('aria-pressed', String(isFavorite));
  button.setAttribute('aria-label', `${isFavorite ? 'Remove from' : 'Add to'} favorites: ${label}`);
}

function updateCurrentFavorite() {
  const track = getTrack(currentTrackId);
  if (!track) return;
  updateFavoriteButton(currentFavoriteButton, favorites.has(track.id), track.title);
}

function updateVolumeControl() {
  const volume = audio.volume;
  const icon = volume === 0 ? 'fa-volume-xmark' : volume <= 0.5 ? 'fa-volume-low' : 'fa-volume-high';
  volumeButton.innerHTML = `<i class="fas ${icon}" aria-hidden="true"></i>`;
  volumeButton.setAttribute('aria-label', volume === 0 ? 'Unmute' : 'Mute');
  volumeButton.setAttribute('aria-pressed', String(volume === 0));
  volumeValue.textContent = `${Math.round(volume * 100)}%`;
  volumeSlider.value = String(volume);
  volumeSlider.style.setProperty('--volume-level', `${volume * 100}%`);
}

function updatePlaybackOptions() {
  shuffleButton.classList.toggle('active', shuffleEnabled);
  shuffleButton.setAttribute('aria-pressed', String(shuffleEnabled));
  shuffleButton.setAttribute('aria-label', `Shuffle ${shuffleEnabled ? 'on' : 'off'}`);
  repeatButton.classList.toggle('active', repeatMode !== 'off');
  repeatButton.setAttribute('aria-pressed', String(repeatMode !== 'off'));
  repeatButton.setAttribute('aria-label', `Repeat ${repeatMode}`);
  repeatLabel.textContent = `REPEAT ${repeatMode.toUpperCase()}`;
  const icon = repeatMode === 'one' ? 'fa-repeat-1' : 'fa-repeat';
  repeatButton.querySelector('i').className = `fas ${icon}`;
}

function updateProgress() {
  const duration = audio.duration;
  const currentTime = audio.currentTime;
  const percentage = Number.isFinite(duration) && duration > 0 ? (currentTime / duration) * 100 : 0;
  progress.style.width = `${percentage}%`;
  progressCircle.style.left = `${percentage}%`;
  seekBar.setAttribute('aria-valuenow', String(Math.round(percentage)));
  seekBar.setAttribute('aria-valuetext', `${formatTime(currentTime)} of ${formatTime(duration)}`);
  currentTimeLabel.textContent = formatTime(currentTime);
  durationLabel.textContent = formatTime(duration);
}

function updateCurrentTrack(track) {
  currentTrackId = track.id;
  title.textContent = track.title;
  document.querySelector('.track-subtitle').textContent = track.blob ? 'Added from your device.' : 'A little space to get lost in the music.';
  coverImage.hidden = !track.cover;
  coverPlaceholder.hidden = Boolean(track.cover);
  if (track.cover) {
    coverImage.src = track.cover;
    coverImage.alt = `${track.title} album cover`;
  }
  audio.src = getTrackSource(track);
  audio.load();
  progress.style.width = '0%';
  progressCircle.style.left = '0%';
  seekBar.setAttribute('aria-valuenow', '0');
  seekBar.setAttribute('aria-valuetext', '0:00');
  currentTimeLabel.textContent = '0:00';
  durationLabel.textContent = '0:00';
  updateCurrentFavorite();
  updatePlaybackState();
  saveState();
}

function recordRecent(trackId) {
  recentIds = [trackId, ...recentIds.filter((id) => id !== trackId)].slice(0, 30);
  saveState();
  if (activeView === 'recent') renderLibrary();
}

async function playSong() {
  try {
    await audio.play();
    if (currentTrackId) recordRecent(currentTrackId);
  } catch (error) {
    updatePlaybackState();
    showLibraryMessage('This track could not be played. Try another audio file.');
    if (error.name !== 'AbortError') console.error('Unable to play track:', error);
  }
}

function playTrack(trackId, queueIds = getVisibleTracks().map((track) => track.id)) {
  const track = getTrack(trackId);
  if (!track) return;
  currentQueue = queueIds.includes(trackId) ? [...queueIds] : [trackId];
  updateCurrentTrack(track);
  renderLibrary();
  playSong();
}

function getBaseViewTracks() {
  if (activeView === 'favorites') return allTracks().filter((track) => favorites.has(track.id));
  if (activeView === 'recent') return recentIds.map(getTrack).filter(Boolean);
  if (activeView.startsWith('playlist:')) {
    const playlist = playlists.find((item) => item.id === activeView.slice('playlist:'.length));
    return (playlist?.trackIds || []).map(getTrack).filter(Boolean);
  }
  return allTracks();
}

function getVisibleTracks() {
  const query = librarySearch.value.trim().toLocaleLowerCase();
  return getBaseViewTracks().filter((track) => !query || track.title.toLocaleLowerCase().includes(query));
}

function setLibraryMessageForEmptyView() {
  if (librarySearch.value.trim()) libraryMessage.textContent = 'No songs match your search.';
  else if (activeView === 'favorites') libraryMessage.textContent = 'Your favorite tracks will appear here. Tap the heart on any song.';
  else if (activeView === 'recent') libraryMessage.textContent = 'Tracks you play will show up here.';
  else if (activeView.startsWith('playlist:')) libraryMessage.textContent = 'This playlist is empty. Add tracks with the plus button.';
  else libraryMessage.textContent = 'Add songs from your device to grow your library.';
  libraryMessage.hidden = false;
}

function makeTrackRow(track, queue) {
  const row = document.createElement('li');
  row.className = `track-row${track.id === currentTrackId ? ' current-track' : ''}`;

  const main = document.createElement('button');
  main.type = 'button';
  main.className = 'track-main';
  main.setAttribute('aria-label', `Play ${track.title}`);
  main.setAttribute('aria-pressed', String(track.id === currentTrackId));
  main.addEventListener('click', () => playTrack(track.id, queue));

  const art = document.createElement('span');
  art.className = 'track-art';
  if (track.cover) {
    const image = document.createElement('img');
    image.src = track.cover;
    image.alt = '';
    art.append(image);
  } else {
    const musicIcon = document.createElement('i');
    musicIcon.className = 'fas fa-music';
    musicIcon.setAttribute('aria-hidden', 'true');
    art.append(musicIcon);
  }

  const details = document.createElement('span');
  details.className = 'track-details';
  const name = document.createElement('span');
  name.className = 'track-name';
  name.textContent = track.title;
  const source = document.createElement('span');
  source.className = 'track-source';
  source.textContent = track.blob ? 'FROM YOUR DEVICE' : 'IN YOUR LIBRARY';
  details.append(name, source);

  const playIcon = document.createElement('i');
  playIcon.className = `fas ${track.id === currentTrackId && !audio.paused ? 'fa-volume-high' : 'fa-play'}`;
  playIcon.setAttribute('aria-hidden', 'true');
  main.append(art, details, playIcon);

  const favoriteButton = document.createElement('button');
  favoriteButton.type = 'button';
  favoriteButton.className = 'row-icon-button favorite-toggle';
  favoriteButton.innerHTML = '<i class="fas fa-heart" aria-hidden="true"></i>';
  updateFavoriteButton(favoriteButton, favorites.has(track.id), track.title);
  favoriteButton.addEventListener('click', () => toggleFavorite(track.id));

  const playlistButton = document.createElement('button');
  playlistButton.type = 'button';
  playlistButton.className = 'row-icon-button';
  if (activeView.startsWith('playlist:')) {
    playlistButton.innerHTML = '<i class="fas fa-minus" aria-hidden="true"></i>';
    playlistButton.setAttribute('aria-label', `Remove ${track.title} from this playlist`);
    playlistButton.title = 'Remove from playlist';
    playlistButton.addEventListener('click', () => removeTrackFromPlaylist(track.id));
  } else {
    playlistButton.innerHTML = '<i class="fas fa-plus" aria-hidden="true"></i>';
    playlistButton.setAttribute('aria-label', `Add ${track.title} to selected playlist`);
    playlistButton.title = 'Add to selected playlist';
    playlistButton.disabled = !playlistTarget.value;
    playlistButton.addEventListener('click', () => addTrackToPlaylist(track.id));
  }

  row.append(main, favoriteButton, playlistButton);
  if (track.blob) {
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'row-icon-button remove-track-button';
    removeButton.innerHTML = '<i class="fas fa-trash-can" aria-hidden="true"></i>';
    removeButton.setAttribute('aria-label', `Remove ${track.title} from your library`);
    removeButton.title = 'Remove from library';
    removeButton.addEventListener('click', () => removeImportedTrack(track.id));
    row.append(removeButton);
  }
  return row;
}

function renderPlaylistTargets() {
  const selected = playlistTarget.value;
  playlistTarget.replaceChildren(new Option('Choose playlist', ''));
  playlists.forEach((playlist) => playlistTarget.add(new Option(playlist.name, playlist.id)));
  if (playlists.some((playlist) => playlist.id === selected)) playlistTarget.value = selected;
}

function makePlaylistTab(playlist) {
  const group = document.createElement('span');
  group.className = 'playlist-tab-group';
  const tab = document.createElement('button');
  tab.type = 'button';
  tab.className = `library-tab${activeView === `playlist:${playlist.id}` ? ' active' : ''}`;
  tab.textContent = playlist.name;
  tab.setAttribute('aria-pressed', String(activeView === `playlist:${playlist.id}`));
  tab.addEventListener('click', () => setActiveView(`playlist:${playlist.id}`));
  const rename = document.createElement('button');
  rename.type = 'button';
  rename.className = 'playlist-manage-button';
  rename.innerHTML = '<i class="fas fa-pen" aria-hidden="true"></i>';
  rename.setAttribute('aria-label', `Rename ${playlist.name}`);
  rename.title = 'Rename playlist';
  rename.addEventListener('click', () => openPlaylistDialog(playlist.id));
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'playlist-manage-button';
  remove.innerHTML = '<i class="fas fa-xmark" aria-hidden="true"></i>';
  remove.setAttribute('aria-label', `Delete ${playlist.name}`);
  remove.title = 'Delete playlist';
  remove.addEventListener('click', () => deletePlaylist(playlist.id));
  group.append(tab, rename, remove);
  return group;
}

function renderLibrary() {
  clearTimeout(libraryMessageTimer);
  libraryMessageTimer = 0;
  const tracks = allTracks();
  const visible = getVisibleTracks();
  libraryCount.textContent = `${tracks.length} ${tracks.length === 1 ? 'track' : 'tracks'}`;
  headerTrackCount.textContent = `${tracks.length} ${tracks.length === 1 ? 'TRACK' : 'TRACKS'}`;
  renderPlaylistTargets();

  libraryTabs.querySelectorAll('[data-view]').forEach((tab) => {
    const active = tab.dataset.view === activeView;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-pressed', String(active));
  });
  playlistTabs.replaceChildren(...playlists.map(makePlaylistTab));
  trackList.replaceChildren(...visible.map((track) => makeTrackRow(track, visible.map((item) => item.id))));

  const empty = visible.length === 0;
  libraryMessage.hidden = !empty;
  if (empty) setLibraryMessageForEmptyView();
}

function setActiveView(view) {
  activeView = view;
  saveState();
  renderLibrary();
}

function toggleFavorite(trackId) {
  if (favorites.has(trackId)) favorites.delete(trackId);
  else favorites.add(trackId);
  saveState();
  updateCurrentFavorite();
  renderLibrary();
}

function addTrackToPlaylist(trackId) {
  const playlist = playlists.find((item) => item.id === playlistTarget.value);
  if (!playlist || playlist.trackIds.includes(trackId)) return;
  playlist.trackIds.push(trackId);
  saveState();
  renderLibrary();
  showLibraryMessage(`Added to ${playlist.name}.`);
}

function removeTrackFromPlaylist(trackId) {
  const playlist = playlists.find((item) => item.id === activeView.slice('playlist:'.length));
  if (!playlist) return;
  playlist.trackIds = playlist.trackIds.filter((id) => id !== trackId);
  currentQueue = playlist.trackIds;
  saveState();
  renderLibrary();
}

function openPlaylistDialog(playlistId = null) {
  editingPlaylistId = playlistId;
  const playlist = playlists.find((item) => item.id === playlistId);
  playlistDialogTitle.textContent = playlist ? 'Rename playlist' : 'Create a playlist';
  playlistNameInput.value = playlist?.name || '';
  playlistForm.querySelector('.dialog-save').textContent = playlist ? 'Save changes' : 'Save playlist';
  playlistDialog.showModal();
  playlistNameInput.focus();
}

function savePlaylist(event) {
  event.preventDefault();
  const name = playlistNameInput.value.trim();
  if (!name) return;
  const existing = playlists.find((item) => item.id === editingPlaylistId);
  if (existing) existing.name = name;
  else {
    const playlist = { id: createId('playlist'), name, trackIds: [] };
    playlists.push(playlist);
    playlistTarget.value = playlist.id;
  }
  playlistDialog.close();
  playlistForm.reset();
  saveState();
  renderLibrary();
}

function deletePlaylist(playlistId) {
  const playlist = playlists.find((item) => item.id === playlistId);
  if (!playlist || !window.confirm(`Delete the playlist "${playlist.name}"?`)) return;
  playlists = playlists.filter((item) => item.id !== playlistId);
  if (activeView === `playlist:${playlistId}`) activeView = 'all';
  saveState();
  renderLibrary();
}

function chooseNextTrack(manual = false) {
  const queue = currentQueue.filter((id) => getTrack(id));
  if (!queue.length) return null;
  if (shuffleEnabled && queue.length > 1) {
    const options = queue.filter((id) => id !== currentTrackId);
    return options[Math.floor(Math.random() * options.length)];
  }
  const index = queue.indexOf(currentTrackId);
  if (index < queue.length - 1) return queue[index + 1];
  if (repeatMode === 'all') return queue[0];
  if (manual && repeatMode === 'one') return queue.length > 1 ? queue[(index + 1) % queue.length] : queue[0];
  return null;
}

function nextSong(manual = true) {
  const nextId = chooseNextTrack(manual);
  if (!nextId) {
    audio.pause();
    return;
  }
  playTrack(nextId, currentQueue);
}

function previousSong() {
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  const queue = currentQueue.filter((id) => getTrack(id));
  if (shuffleEnabled) {
    const previousShuffledTrack = recentIds.slice(1).find((id) => queue.includes(id));
    if (previousShuffledTrack) {
      playTrack(previousShuffledTrack, queue);
      return;
    }
  }
  const index = queue.indexOf(currentTrackId);
  const previousId = index > 0 ? queue[index - 1] : repeatMode === 'all' ? queue.at(-1) : queue[0];
  if (previousId) playTrack(previousId, queue);
}

function seekTo(clientX) {
  if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
  const bounds = seekBar.getBoundingClientRect();
  if (bounds.width) audio.currentTime = Math.min(1, Math.max(0, (clientX - bounds.left) / bounds.width)) * audio.duration;
}

function removeImportedTrack(trackId) {
  if (!window.confirm('Remove this imported song from your device library? The original file will not be deleted.')) return;
  deleteImportedTrack(trackId).then(() => {
    const wasCurrent = currentTrackId === trackId;
    if (wasCurrent) audio.pause();
    if (objectUrls.has(trackId)) {
      URL.revokeObjectURL(objectUrls.get(trackId));
      objectUrls.delete(trackId);
    }
    importedTracks = importedTracks.filter((track) => track.id !== trackId);
    favorites.delete(trackId);
    recentIds = recentIds.filter((id) => id !== trackId);
    playlists.forEach((playlist) => {
      playlist.trackIds = playlist.trackIds.filter((id) => id !== trackId);
    });
    if (wasCurrent && allTracks()[0]) updateCurrentTrack(allTracks()[0]);
    else saveState();
    renderLibrary();
    showLibraryMessage('Song removed from your library.');
  }).catch((error) => {
    showLibraryMessage(error.message);
  });
}

async function importAudioFiles(files) {
  const records = [...files]
    .filter((file) => file.type.startsWith('audio/') || /\.(mp3|wav|m4a|ogg|flac|aac)$/i.test(file.name))
    .map((file) => ({
      id: createId('import'),
      title: file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Untitled track',
      fileName: file.name,
      blob: file,
      addedAt: Date.now(),
    }));
  if (!records.length) {
    showLibraryMessage('Choose audio files such as MP3, WAV, M4A, OGG, FLAC, or AAC.');
    return;
  }
  try {
    if (database) await writeImportedTracks(records);
    importedTracks.push(...records);
    saveState();
    renderLibrary();
    const noun = records.length === 1 ? 'song was' : 'songs were';
    showLibraryMessage(database
      ? `${records.length} ${noun} added to your library.`
      : `${records.length} ${noun} added for this session. Browser storage is unavailable, so they will not persist.`);
  } catch (error) {
    showLibraryMessage(`Could not save these audio files: ${error.message}`);
  }
  importInput.value = '';
}

function restoreState(state) {
  const validIds = new Set(allTracks().map((track) => track.id));
  favorites = new Set((Array.isArray(state.favorites) ? state.favorites : []).filter((id) => validIds.has(id)));
  playlists = (Array.isArray(state.playlists) ? state.playlists : [])
    .filter((item) => item && typeof item.name === 'string' && typeof item.id === 'string')
    .map((item) => ({
      id: item.id,
      name: item.name.slice(0, 40),
      trackIds: Array.isArray(item.trackIds) ? item.trackIds.filter((id) => validIds.has(id)) : [],
    }));
  recentIds = (Array.isArray(state.recentIds) ? state.recentIds : []).filter((id) => validIds.has(id)).slice(0, 30);
  shuffleEnabled = Boolean(state.shuffleEnabled);
  repeatMode = ['off', 'all', 'one'].includes(state.repeatMode) ? state.repeatMode : 'off';
  if (typeof state.volume === 'number') audio.volume = Math.min(1, Math.max(0, state.volume));
  if (['all', 'favorites', 'recent'].includes(state.activeView) || playlists.some((item) => `playlist:${item.id}` === state.activeView)) {
    activeView = state.activeView;
  }
}

async function initialize() {
  let state = readSavedState();
  renderLibrary();
  let storageUnavailable = false;
  try {
    database = await openDatabase();
    importedTracks = (await readImportedTracks()).sort((a, b) => (a.addedAt || 0) - (b.addedAt || 0));
  } catch (error) {
    storageUnavailable = true;
    console.warn(error);
  }
  restoreState(state);
  currentQueue = getBaseViewTracks().map((track) => track.id);
  const initialTrack = getTrack(state.activeTrackId) || allTracks()[0];
  if (initialTrack) updateCurrentTrack(initialTrack);
  updatePlaybackOptions();
  updateVolumeControl();
  renderLibrary();
  if (storageUnavailable) showLibraryMessage('Device storage is unavailable. Imported tracks will not be retained after this session.');
}

playButton.addEventListener('click', () => {
  if (audio.paused) playSong();
  else audio.pause();
});
previousButton.addEventListener('click', previousSong);
nextButton.addEventListener('click', () => nextSong(true));
currentFavoriteButton.addEventListener('click', () => toggleFavorite(currentTrackId));
shuffleButton.addEventListener('click', () => {
  shuffleEnabled = !shuffleEnabled;
  updatePlaybackOptions();
  saveState();
});
repeatButton.addEventListener('click', () => {
  repeatMode = repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off';
  updatePlaybackOptions();
  saveState();
});
audio.addEventListener('play', updatePlaybackState);
audio.addEventListener('pause', updatePlaybackState);
audio.addEventListener('ended', () => {
  if (repeatMode === 'one') {
    audio.currentTime = 0;
    playSong();
  } else {
    nextSong(false);
  }
});
audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('loadedmetadata', updateProgress);
audio.addEventListener('durationchange', updateProgress);
audio.addEventListener('error', () => {
  if (currentTrackId) showLibraryMessage('Could not load this track. Check that the audio file is available.');
  updatePlaybackState();
});
seekBar.addEventListener('click', (event) => seekTo(event.clientX));
seekBar.addEventListener('keydown', (event) => {
  if (!Number.isFinite(audio.duration)) return;
  const step = event.shiftKey ? 10 : 5;
  if (event.key === 'ArrowRight' || event.key === 'ArrowUp') audio.currentTime = Math.min(audio.duration, audio.currentTime + step);
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') audio.currentTime = Math.max(0, audio.currentTime - step);
  else if (event.key === 'Home') audio.currentTime = 0;
  else if (event.key === 'End') audio.currentTime = audio.duration;
  else return;
  event.preventDefault();
});
volumeSlider.addEventListener('input', () => {
  audio.volume = Number(volumeSlider.value);
  if (audio.volume > 0) previousVolume = audio.volume;
  updateVolumeControl();
  saveState();
});
volumeButton.addEventListener('click', () => {
  if (audio.volume > 0) {
    previousVolume = audio.volume;
    audio.volume = 0;
  } else {
    audio.volume = previousVolume || 1;
  }
  updateVolumeControl();
  saveState();
});
libraryTabs.addEventListener('click', (event) => {
  const tab = event.target.closest('[data-view]');
  if (tab) setActiveView(tab.dataset.view);
});
librarySearch.addEventListener('input', renderLibrary);
playlistTarget.addEventListener('change', renderLibrary);
document.getElementById('new-playlist').addEventListener('click', () => openPlaylistDialog());
document.getElementById('cancel-playlist').addEventListener('click', () => playlistDialog.close());
playlistForm.addEventListener('submit', savePlaylist);
importInput.addEventListener('change', () => importAudioFiles(importInput.files));

window.addEventListener('pagehide', () => {
  objectUrls.forEach((url) => URL.revokeObjectURL(url));
});

audio.volume = 1;
updateVolumeControl();
initialize();
