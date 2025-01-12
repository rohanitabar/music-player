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
const circle = document.getElementById('circle') ;
const coverImg = document.getElementById('cover');  
const sound = document.getElementById('volume');  
const volumeIcon = document.getElementById('volume-icon');

// Download Image
const img1 = document.getElementById('img-1');  
const img2 = document.getElementById('img-2');  
const img3 = document.getElementById('img-3');  
const img4 = document.getElementById('img-4');  
const img5 = document.getElementById('img-5');  
const img6 = document.getElementById('img-6');  

// Sound Song  
// Set initial volume
audio.volume = sound.value;  

// Event listener for volume control
sound.addEventListener('input', function() {  
  audio.volume = sound.value;  
  
  // Change Icon 
function updateVolumeIcon() {

    if (audio.volume === 0) {

        volumeIcon.innerHTML = `<i class="fas fa-volume-mute"></i>`;

    } else if (audio.volume > 0 && audio.volume <= 0.5) {

        volumeIcon.innerHTML = `<i class="fas fa-volume-down"></i>`;

    } else if (audio.volume > 0.5 && audio.volume < 1) {

        volumeIcon.innerHTML = `<i class="fas fa-volume-up"></i>`;

    } else if (audio.volume === 1) { 
      volumeIcon.innerHTML = `<i class="fas fa-volume-up"></i>`
    }

}
  // Initial call to set the correct icon based on the initial volume

updateVolumeIcon();
});
// Event listener for volume icon click

volumeIcon.addEventListener('click', e => {
    // Check the current volume and toggle accordingly
    if (audio.volume > 0) {
        // Mute the audio
        audio.volume = 0; // Set volume to 0
        sound.value = 0; // Update the sound input value
        volumeIcon.innerHTML = `<i class="fas fa-volume-off"></i>`;
    } else {
        // Unmute the audio
        audio.volume = 1; // Set volume to 1 (or a preferred level)
        sound.value = 1; // Update the sound input value
        volumeIcon.innerHTML = `<i class="fas fa-volume-up"></i>`;
    }
});

// Track list  
const songs = [  
    {
        name: 'Koohe Ghaf',  
        displayName: 'Koohe Ghaf',   
        path: '/music/Koohe Ghaf.mp3',  
    },  
    {  
        name: 'Eshghemoon',  
        displayName: 'Eshghemoon',  
        path: '/music/Eshghemoon.mp3'  
    },  
    {  
        name: 'Emperatoore-Divooneha',  
        displayName: 'Emperatoore Divooneha',  
        path: '/music/Emperatoore Divooneha.mp3'  
    }  ,
    {  
        name: 'Baladam Boodi',  
        displayName: 'Baladam Boodi',  
        path: '/music/Baladam Boodi.mp3'  
    }  ,
    {  
        name: '2ta Cheshat',  
        displayName: '2ta Cheshat',  
        path: '/music/2ta Cheshat.mp3'  
    }  ,
    {  
        name: 'Rasti Rasti',  
        displayName: 'Rasti Rasti',  
        path: '/music/Rasti Rasti.mp3'  
    } 
];  

const Images = ['/img/Koohe-Ghaf.jpg','/img/Eshghemoon.jpg','/img/Emperatoore-Divooneha.jpg','/img/Baladam-Boodi.jpg','/img/2ta-Cheshat.jpg','/img/Rasti-Rasti.jpg'];


let songIndex = 0;  

// Load song  
function loadSong(song) {  
    title.innerText = song.displayName;  
    audio.src = song.path;  
    coverImg.src = song.image;
    audio.volume = 1;
    sound.value = 1;
    volumeIcon.innerHTML = `<i class="fas fa-volume-up"></i>`;
    
    // Update image visibility  
    sound.value=10;  
    img1.style.display = songIndex === 0 ? 'block' : 'none';  
    img2.style.display = songIndex === 1 ? 'block' : 'none';  
    img3.style.display = songIndex === 2 ? 'block' : 'none';  
    img4.style.display = songIndex === 3 ? 'block' : 'none';
    img5.style.display = songIndex === 4 ? 'block' : 'none'; 
    img6.style.display = songIndex === 5 ? 'block' : 'none'; 

    // Reset time display when loading a new song  
    durTime.innerText = '0:00';  
    currTime.innerText = '0:00';  
}  

// Play music  
function playSong() {  
    musicContainer.classList.add('play');  
    playBtn.innerHTML = `<i class="fas fa-pause"></i>`;  
    audio.play();  
}  

// Pause music  
function pauseSong() {  
    musicContainer.classList.remove('play');  
    playBtn.innerHTML = `<i class="fas fa-play"></i>`;  
    audio.pause();  
}  

// Next & prev btn  
function nextSong() {  
    songIndex = (songIndex + 1) % songs.length;  
    loadSong(songs[songIndex]);  
    playSong();  
}  

function prevSong() {  
    songIndex = (songIndex - 1 + songs.length) % songs.length;  
    loadSong(songs[songIndex]);  
    playSong();  
}  

// Update progress bar  
function updateProgress(e) {  
    const { duration, currentTime } = e.srcElement;  
    if (duration) {  
        // Calculate progress percentage  
        const progressPercent = (currentTime / duration) * 100;  
        // Update width of the progress bar  
        progress.style.width = `${progressPercent}%`;   

        // Update the position of the circle  
        const containerWidth = document.getElementById('progress-container').clientWidth;  // Get the width of the progress container  
        const circlePosition = (progressPercent / 100) * (containerWidth - 20);  // Calculate the circle's position (subtracting circle width for proper alignment)  
        circle.style.left = `${circlePosition}px`;  // Set the left position of the circle  

        // Update time display  
        const durationMinutes = Math.floor(duration / 60);  
        const durationSeconds = Math.floor(duration % 60);  
        const currentMinutes = Math.floor(currentTime / 60);  
        const currentSeconds = Math.floor(currentTime % 60);  

        // Display duration and current time  
        durTime.innerText = `${durationMinutes}:${durationSeconds < 10 ? '0' : ''}${durationSeconds}`;  
        currTime.innerText = `${currentMinutes}:${currentSeconds < 10 ? '0' : ''}${currentSeconds}`;  
    }   
}  

// Change time with click in progress bar  
function setProgress(e) {  
    const width = progressContainer.clientWidth;  
    const clickX = e.offsetX;  
    const duration = audio.duration;  
    audio.currentTime = (clickX / width) * duration;  
}  

// Play, next, prev, audio & progressBar EventListener  
playBtn.addEventListener('click', () => {  
    const isPlaying = musicContainer.classList.contains('play');  
    if (isPlaying) {  
        pauseSong();  
    } else {  
        playSong();  
    }  
});  

nextBtn.addEventListener('click', nextSong);  
prevBtn.addEventListener('click', prevSong);  
audio.addEventListener('timeupdate', updateProgress);  
progressContainer.addEventListener('click', setProgress);  

// Play next song when current song ends  
audio.addEventListener('ended', nextSong);  

// Load first music when DOM is ready  
document.addEventListener('DOMContentLoaded', () => {  
    loadSong(songs[songIndex]);  
});