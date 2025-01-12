document.addEventListener('DOMContentLoaded', function () {
    // Download Variables
    const audio = document.getElementById('audio');
    const playBtn = document.getElementById('play');
    const prevBtn = document.getElementById('prev');
    const nextBtn = document.getElementById('next');
    const title = document.getElementById('title');
    const currTime = document.getElementById('currTime');
    const durTime = document.getElementById('durTime');
    const progressContainer = document.getElementById('progress-container');
    const progress = document.getElementById('progress');
    const musicContainer = document.getElementById('music-container');
    const coverImg = document.getElementById('cover');
    const sound = document.getElementById('volume');

// Events & Works

  // Track list
const songs = [
    {
        name: 'Koohe Ghaf',
        displayName: 'Koohe Ghaf',
        image: `<img src="/img/Koohe-Ghaf.jpg" id="img-1">`,  
        path: '/music/Koohe Ghaf.mp3',
    },
    {
        name: 'Eshghemoon',
        displayName: 'Eshghemoon',
        image: `<img src="/img/Eshghemoon.jpg" id="img-2">`,
        path: '/music/Eshghemoon.mp3'
    },
    {
        name: 'Emperatoore-Divooneha',
        displayName: 'Emperatoore Divooneha',
        image: `<img src="/img/Emperatoore-Divooneha.jpg" id="img-3">`,
        path: '/music/Emperatoore Divooneha.mp3'
    }
];

let songIndex = 0;

  // Load song
function loadSong(song) {
  title.innerText = song.displayName;
  audio.src = song.path;
  coverImg.src = `${song.image}`;  
  playBtn.innerHTML=`<i class="fas fa-play"></i>`;
  const img= `${song.image}`;
}

  // Play music
function playSong() {
  musicContainer.classList.add('play');
  playBtn.innerHTML=`<i class="fas fa-pause"></i>`;
  audio.play();
}

  // Pause music
function pauseSong() {
  musicContainer.classList.remove('play');
  playBtn.innerHTML=`<i class="fas fa-play"></i>`;
  audio.pause();
}

  // Next & prev btn
function nextSong() {
    songIndex = (songIndex + 1) % songs.length;
    loadSong(songs[songIndex]);
    playSong();
    console.log(`Playing next song: ${songs[songIndex].displayName}`);
}

    function prevSong() {
        songIndex = (songIndex - 1 + songs.length) % songs.length;
        loadSong(songs[songIndex]);
        playSong();
        console.log(`Playing previous song: ${songs[songIndex].displayName}`);
    }

    // Update progress bar
    function updateProgress(e) {
        const { duration, currentTime } = e.srcElement;
        const progressPercent = (currentTime / duration) * 100;
        progress.style.width = `${progressPercent}%`;

        // Update time
        const durationMinutes = Math.floor(duration / 60);
        const durationSeconds = Math.floor(duration % 60);
        const currentMinutes = Math.floor(currentTime / 60);
        const currentSeconds = Math.floor(currentTime % 60);

        durTime.innerText = `${durationMinutes}:${durationSeconds < 10 ? '0' : ''}${durationSeconds}`;
        currTime.innerText = `${currentMinutes}:${currentSeconds < 10 ? '0' : ''}${currentSeconds}`;
    }

    // Change time with click in progress bar
function setProgress(e) {
    const width = progressContainer.clientWidth;
    const clickX = e.offsetX;
    const duration = audio.duration;
    audio.currentTime = (clickX / width) * duration;
}

    // play, next, prev, audio & progressBar EventListener
    playBtn.addEventListener('click', () => {
        const isPlaying = musicContainer.classList.contains('play');
        if (isPlaying) {
            pauseSong();
            playBtn.querySelector('i.fas').classList.remove('fa-pause');
            playBtn.querySelector('i.fas').classList.add('fa-play');
        } else {
            playSong();
            playBtn.querySelector('i.fas').classList.remove('fa-play');
            playBtn.querySelector('i.fas').classList.add('fa-pause');
        }
    });

    nextBtn.addEventListener('click', nextSong);
    prevBtn.addEventListener('click', prevSong);
    audio.addEventListener('timeupdate', updateProgress);
    progressContainer.addEventListener('click', setProgress);

    // Play next song when current song ends
    audio.addEventListener('ended', nextSong);

    // Load first music
    loadSong(songs[songIndex]);
    console.log('Initial song loaded');
});

document.getElementById('cover').src = '/img/Koohe-Ghaf.jpg?t=' + new Date().getTime();

        const audioPlayer = document.getElementById('audioPlayer');  

        audioPlayer.volume = sound.value;  

        sound.addEventListener('input', function() {  
            audioPlayer.volume = sound.value;  
        });  