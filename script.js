document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const musicPlayer = document.querySelector('.music-player');
    const playPauseBtn = document.querySelector('#play-pause');
    const prevBtn = document.querySelector('#prev');
    const nextBtn = document.querySelector('#next');
    const audio = new Audio();
    const progressBar = document.querySelector('.progress-bar');
    const progressArea = document.querySelector('.progress-area');
    const currentTimeEl = document.querySelector('#current-time');
    const maxDurationEl = document.querySelector('#max-duration');
    const musicList = document.querySelector('.music-list');
    const musicListToggle = document.querySelector('.music-list-toggle');
    const closeList = document.querySelector('.music-list .header .row i');
    const musicListContainer = document.querySelector('.music-list ul');
    const albumCover = document.querySelector('#album-cover');
    const songTitle = document.querySelector('#title');
    const artistName = document.querySelector('#artist');
    const localMusicBtn = document.querySelector('#local-music-btn');
    const onlineMusicBtn = document.querySelector('#online-music-btn');
    const addMusicBtn = document.querySelector('#add-music-btn');
    const localFileInput = document.querySelector('#local-file-input');
    const canvas = document.getElementById('visualization');
    const ctx = canvas.getContext('2d');

    // Variables
    let musicIndex = 0;
    let isPlaying = false;
    let currentSource = 'local'; // 'local' or 'online'
    let localMusicList = [];
    let onlineMusicList = [
        {
            name: "Electronic Vibes",
            artist: "DJ Electron",
            src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            img: "https://picsum.photos/id/1/200"
        },
        {
            name: "Acoustic Dreams",
            artist: "Guitar Master",
            src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
            img: "https://picsum.photos/id/2/200"
        },
        {
            name: "Jazz Fusion",
            artist: "Smooth Sax",
            src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
            img: "https://picsum.photos/id/3/200"
        }
    ];
    let currentMusicList = onlineMusicList;
    let audioContext;
    let analyser;
    let dataArray;
    let bufferLength;
    let animationId;

    // Initialize canvas size
    function resizeCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Set up audio visualization
    function setupAudioVisualization() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            
            analyser.fftSize = 256;
            bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
        }
    }

    // Draw visualization
    function drawVisualization() {
        animationId = requestAnimationFrame(drawVisualization);
        
        analyser.getByteFrequencyData(dataArray);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Create a gradient background that changes with music intensity
        const intensity = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        const hue = (intensity + performance.now() / 100) % 360;
        ctx.fillStyle = `hsl(${hue}, 70%, 5%)`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
            
            // Create color based on frequency and intensity
            const hue2 = (hue + i) % 360;
            ctx.fillStyle = `hsl(${hue2}, 100%, 50%)`;
            
            // Draw bar
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            
            // Draw circular visualization
            const radius = (dataArray[i] / 255) * (canvas.width / 4);
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const angle = (i / bufferLength) * Math.PI * 2;
            const x2 = centerX + Math.cos(angle) * radius;
            const y2 = centerY + Math.sin(angle) * radius;
            
            ctx.beginPath();
            ctx.arc(x2, y2, 2, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${(hue2 + 180) % 360}, 100%, 50%, 0.8)`;
            ctx.fill();
            
            x += barWidth + 1;
        }
    }

    // Load music function
    function loadMusic(index) {
        if (currentMusicList.length === 0) return;
        
        const music = currentMusicList[index];
        audio.src = music.src;
        songTitle.textContent = music.name;
        artistName.textContent = music.artist;
        
        if (music.img) {
            albumCover.src = music.img;
        } else {
            albumCover.src = 'default-album.jpg';
        }
        
        // Update active song in list
        const allListItems = musicListContainer.querySelectorAll('li');
        allListItems.forEach(item => item.classList.remove('playing'));
        
        const activeItem = musicListContainer.querySelector(`li[data-index="${index}"]`);
        if (activeItem) activeItem.classList.add('playing');
        
        // Scroll to active song
        if (activeItem) {
            activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }

    // Play music function
    function playMusic() {
        musicPlayer.classList.add('playing');
        playPauseBtn.classList.replace('fa-play', 'fa-pause');
        audio.play();
        isPlaying = true;
        
        // Start visualization
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
        
        if (!animationId) {
            drawVisualization();
        }
    }

    // Pause music function
    function pauseMusic() {
        musicPlayer.classList.remove('playing');
        playPauseBtn.classList.replace('fa-pause', 'fa-play');
        audio.pause();
        isPlaying = false;
        
        // Stop visualization
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }

    // Format time function
    function formatTime(time) {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
    }

    // Update progress bar
    function updateProgress(e) {
        const { currentTime, duration } = e.srcElement;
        const progressPercent = (currentTime / duration) * 100;
        progressBar.style.width = `${progressPercent}%`;
        
        currentTimeEl.textContent = formatTime(currentTime);
        if (duration) {
            maxDurationEl.textContent = formatTime(duration);
        }
    }

    // Set progress bar
    function setProgress(e) {
        const width = this.clientWidth;
        const clickX = e.offsetX;
        const duration = audio.duration;
        
        audio.currentTime = (clickX / width) * duration;
    }

    // Update music list UI
    function updateMusicList() {
        musicListContainer.innerHTML = '';
        
        currentMusicList.forEach((music, index) => {
            const li = document.createElement('li');
            li.dataset.index = index;
            li.innerHTML = `
                <div>
                    <span>${music.name}</span>
                    <p>${music.artist}</p>
                </div>
                <span class="duration"></span>
            `;
            
            if (index === musicIndex) {
                li.classList.add('playing');
            }
            
            li.addEventListener('click', () => {
                musicIndex = index;
                loadMusic(musicIndex);
                playMusic();
                musicList.classList.remove('show');
            });
            
            musicListContainer.appendChild(li);
        });
    }

    // Switch music source
    function switchMusicSource(source) {
        currentSource = source;
        
        if (source === 'local') {
            localMusicBtn.classList.add('active');
            onlineMusicBtn.classList.remove('active');
            currentMusicList = localMusicList;
        } else {
            localMusicBtn.classList.remove('active');
            onlineMusicBtn.classList.add('active');
            currentMusicList = onlineMusicList;
        }
        
        updateMusicList();
        
        if (currentMusicList.length > 0) {
            musicIndex = 0;
            loadMusic(musicIndex);
            pauseMusic();
        }
    }

    // Handle local file selection
    function handleLocalFiles(files) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            if (file.type.startsWith('audio/')) {
                const url = URL.createObjectURL(file);
                
                // Create a temporary audio element to get metadata
                const tempAudio = new Audio(url);
                
                tempAudio.addEventListener('loadedmetadata', function() {
                    const musicItem = {
                        name: file.name.replace(/\.[^/.]+$/, ""),
                        artist: 'Local File',
                        src: url,
                        file: file
                    };
                    
                    localMusicList.push(musicItem);
                    
                    if (currentSource === 'local') {
                        updateMusicList();
                        
                        if (localMusicList.length === 1) {
                            musicIndex = 0;
                            loadMusic(musicIndex);
                        }
                    }
                });
            }
        }
    }

    // Event Listeners
    playPauseBtn.addEventListener('click', () => {
        if (currentMusicList.length === 0) return;
        
        if (isPlaying) {
            pauseMusic();
        } else {
            playMusic();
        }
    });

    prevBtn.addEventListener('click', () => {
        if (currentMusicList.length === 0) return;
        
        musicIndex = (musicIndex - 1 + currentMusicList.length) % currentMusicList.length;
        loadMusic(musicIndex);
        playMusic();
    });

    nextBtn.addEventListener('click', () => {
        if (currentMusicList.length === 0) return;
        
        musicIndex = (musicIndex + 1) % currentMusicList.length;
        loadMusic(musicIndex);
        playMusic();
    });

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', () => {
        musicIndex = (musicIndex + 1) % currentMusicList.length;
        loadMusic(musicIndex);
        playMusic();
    });

    progressArea.addEventListener('click', setProgress);

    musicListToggle.addEventListener('click', () => {
        musicList.classList.toggle('show');
    });

    closeList.addEventListener('click', () => {
        musicList.classList.remove('show');
    });

    localMusicBtn.addEventListener('click', () => {
        switchMusicSource('local');
    });

    onlineMusicBtn.addEventListener('click', () => {
        switchMusicSource('online');
    });

    addMusicBtn.addEventListener('click', () => {
        if (currentSource === 'local') {
            localFileInput.click();
        } else {
            // Show a modal to add online music URL
            const url = prompt('Enter the URL of the online music:');
            if (url) {
                const name = prompt('Enter the name of the song:');
                const artist = prompt('Enter the artist name:');
                
                onlineMusicList.push({
                    name: name || 'Unknown Song',
                    artist: artist || 'Unknown Artist',
                    src: url,
                    img: 'default-album.jpg'
                });
                
                updateMusicList();
                
                if (onlineMusicList.length === 1) {
                    musicIndex = 0;
                    loadMusic(musicIndex);
                }
            }
        }
    });

    localFileInput.addEventListener('change', (e) => {
        handleLocalFiles(e.target.files);
    });

    // Support drag and drop for local files
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    document.addEventListener('drop', (e) => {
        e.preventDefault();
        
        if (currentSource === 'local') {
            handleLocalFiles(e.dataTransfer.files);
        }
    });

    // Initialize
    audio.addEventListener('canplay', () => {
        maxDurationEl.textContent = formatTime(audio.duration);
    });

    audio.addEventListener('play', () => {
        setupAudioVisualization();
    });

    // Initialize with online music
    switchMusicSource('online');
    
    if (currentMusicList.length > 0) {
        loadMusic(musicIndex);
    }
});

// Add this to your existing JavaScript file

// Get volume elements
const volumeSlider = document.getElementById('volume');
const volumeIcon = document.getElementById('volume-icon');

// Set initial volume
audio.volume = volumeSlider.value / 100;

// Update volume when slider is moved
volumeSlider.addEventListener('input', () => {
    const volume = volumeSlider.value / 100;
    audio.volume = volume;
    
    // Update volume icon based on volume level
    updateVolumeIcon(volume);
});

// Function to update volume icon based on volume level
function updateVolumeIcon(volume) {
    if (volume === 0) {
        volumeIcon.className = 'fas fa-volume-mute';
    } else if (volume < 0.4) {
        volumeIcon.className = 'fas fa-volume-down';
    } else {
        volumeIcon.className = 'fas fa-volume-up';
    }
}

// Toggle mute when volume icon is clicked
volumeIcon.addEventListener('click', () => {
    if (audio.volume > 0) {
        // Store the current volume before muting
        volumeIcon.dataset.prevVolume = audio.volume;
        audio.volume = 0;
        volumeSlider.value = 0;
        volumeIcon.className = 'fas fa-volume-mute';
    } else {
        // Restore the previous volume
        const prevVolume = volumeIcon.dataset.prevVolume || 0.8;
        audio.volume = prevVolume;
        volumeSlider.value = prevVolume * 100;
        
        // Update icon based on the restored volume
        updateVolumeIcon(prevVolume);
    }
});