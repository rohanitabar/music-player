const audio = document.getElementById('audio');
const playButton = document.getElementById('play');
const previousButton = document.getElementById('prev');
const nextButton = document.getElementById('next');
const title = document.getElementById('title');
const currentTimeLabel = document.getElementById('currTime');
const durationLabel = document.getElementById('durTime');
const seekBar = document.getElementById('progress-container');
const progress = document.getElementById('progress');
const progressCircle = document.querySelector('.circle');
const musicContainer = document.getElementById('music-container');
const volumeSlider = document.getElementById('volume');
const volumeButton = document.getElementById('volume-icon');
const coverImages = [...document.querySelectorAll('.img-container img')];

const songs = [
  { title: 'Koohe Ghaf', file: 'Koohe Ghaf.mp3' },
  { title: 'Eshghemoon', file: 'Eshghemoon.mp3' },
  { title: 'Emperatoore Divooneha', file: 'Emperatoore Divooneha.mp3' },
  { title: 'Baladam Boodi', file: 'Baladam Boodi.mp3' },
  { title: '2ta Cheshat', file: '2ta Cheshat.mp3' },
  { title: 'Rasti Rasti', file: 'Rasti Rasti.mp3' },
];

let songIndex = 0;
let previousVolume = 1;

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function updateVolumeControl() {
  const volume = audio.volume;
  const icon = volume === 0 ? 'fa-volume-mute' : volume <= 0.5 ? 'fa-volume-down' : 'fa-volume-up';
  volumeButton.innerHTML = `<i class="fas ${icon}" aria-hidden="true"></i>`;
  volumeButton.setAttribute('aria-label', volume === 0 ? 'Unmute' : 'Mute');
  volumeButton.setAttribute('aria-pressed', String(volume === 0));
}

function updatePlaybackState() {
  const isPlaying = !audio.paused && !audio.ended;
  musicContainer.classList.toggle('play', isPlaying);
  playButton.innerHTML = `<i class="fas fa-${isPlaying ? 'pause' : 'play'}" aria-hidden="true"></i>`;
  playButton.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
}

function loadSong(index) {
  const song = songs[index];
  title.textContent = song.title;
  audio.src = `./music/${encodeURIComponent(song.file)}`;
  audio.load();
  coverImages.forEach((image, imageIndex) => {
    image.hidden = imageIndex !== index;
  });
  progress.style.width = '0%';
  seekBar.setAttribute('aria-valuenow', '0');
  currentTimeLabel.textContent = '0:00';
  durationLabel.textContent = '0:00';
  updatePlaybackState();
}

async function playSong() {
  try {
    await audio.play();
  } catch (error) {
    updatePlaybackState();
    if (error.name !== 'AbortError') console.error('Unable to play this track:', error);
  }
}

function changeSong(direction) {
  songIndex = (songIndex + direction + songs.length) % songs.length;
  loadSong(songIndex);
  playSong();
}

function updateProgress() {
  const duration = audio.duration;
  const currentTime = audio.currentTime;
  const percentage = Number.isFinite(duration) && duration > 0 ? (currentTime / duration) * 100 : 0;
  progress.style.width = `${percentage}%`;
  progressCircle.style.left = `${percentage}%`;
  seekBar.setAttribute('aria-valuenow', String(Math.round(percentage)));
  currentTimeLabel.textContent = formatTime(currentTime);
  durationLabel.textContent = formatTime(duration);
}

function seekTo(clientX) {
  if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
  const bounds = seekBar.getBoundingClientRect();
  if (bounds.width === 0) return;
  const fraction = Math.min(1, Math.max(0, (clientX - bounds.left) / bounds.width));
  audio.currentTime = fraction * audio.duration;
}

playButton.addEventListener('click', () => {
  if (audio.paused) playSong();
  else audio.pause();
});
previousButton.addEventListener('click', () => changeSong(-1));
nextButton.addEventListener('click', () => changeSong(1));
audio.addEventListener('play', updatePlaybackState);
audio.addEventListener('pause', updatePlaybackState);
audio.addEventListener('ended', () => changeSong(1));
audio.addEventListener('timeupdate', updateProgress);
audio.addEventListener('loadedmetadata', updateProgress);
audio.addEventListener('durationchange', updateProgress);
audio.addEventListener('error', () => {
  updatePlaybackState();
  console.error(`Could not load audio file: ${audio.currentSrc}`);
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
});
volumeButton.addEventListener('click', () => {
  if (audio.volume > 0) {
    previousVolume = audio.volume;
    audio.volume = 0;
  } else {
    audio.volume = previousVolume || 1;
  }
  volumeSlider.value = String(audio.volume);
  updateVolumeControl();
});

audio.volume = Number(volumeSlider.value);
updateVolumeControl();
loadSong(songIndex);
