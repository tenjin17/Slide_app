let slideInterval;
let isPlaying = false;
let currentIndex = 0;
let images = [];
let intervalSpeed = 6000;
let transitionSpeed = 0.9;
let currentEffect = 'fade';
let currentAudio = null;
let youtubePlayer = null;
let musicPlaylist = [];
let currentMusicIndex = 0;

// 初期化時に表示サイズを大きいサイズに設定
window.addEventListener('load', function() {
    const container = document.getElementById('slideshow-container');
    container.style.height = '90vh';
    
    // トランジション速度の初期値を設定
    document.getElementById('transitionSpeed').value = transitionSpeed;
    document.getElementById('transitionSpeedValue').textContent = transitionSpeed + '秒';
    
    // スライド切替間隔の初期値を設定
    document.getElementById('speedControl').value = intervalSpeed / 1000;
    document.getElementById('timer').textContent = (intervalSpeed / 1000) + '秒';
});

const effects = ['fade', 'slide', 'zoom', 'flip'];

function getRandomEffect() {
    return effects[Math.floor(Math.random() * effects.length)];
}

// サイドバーの制御
document.getElementById('toggleSidebar').addEventListener('click', function() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    sidebar.classList.toggle('open');
    mainContent.classList.toggle('main-content-shifted');
});

document.addEventListener('click', function(event) {
    const sidebar = document.getElementById('sidebar');
    const toggleButton = document.getElementById('toggleSidebar');
    if (!sidebar.contains(event.target) && !toggleButton.contains(event.target)) {
        sidebar.classList.remove('open');
        document.getElementById('main-content').classList.remove('main-content-shifted');
    }
});

document.getElementById('settingsButton').addEventListener('click', function() {
    document.getElementById('settings-modal').style.display = 'block';
});

document.getElementById('closeSettings').addEventListener('click', function() {
    document.getElementById('settings-modal').style.display = 'none';
});

// 全画面表示の制御
document.getElementById('fullscreenButton').addEventListener('click', function() {
    const container = document.getElementById('slideshow-container');
    if (!document.fullscreenElement) {
        container.requestFullscreen().then(() => {
            container.classList.add('fullscreen-container');
            this.querySelector('i').className = 'fas fa-compress';
        }).catch(err => {
            console.error(`全画面表示エラー: ${err.message}`);
        });
    } else {
        document.exitFullscreen().then(() => {
            container.classList.remove('fullscreen-container');
            this.querySelector('i').className = 'fas fa-expand';
        }).catch(err => {
            console.error(`全画面終了エラー: ${err.message}`);
        });
    }
});

// 全画面終了時のイベントリスナー
document.addEventListener('fullscreenchange', function() {
    const container = document.getElementById('slideshow-container');
    const fullscreenButton = document.getElementById('fullscreenButton');
    if (!document.fullscreenElement) {
        container.classList.remove('fullscreen-container');
        fullscreenButton.querySelector('i').className = 'fas fa-expand';
    }
});

// 全画面表示時のコントロール
document.getElementById('exitFullscreen').addEventListener('click', function() {
    if (document.fullscreenElement) {
        document.exitFullscreen();
    }
});

document.getElementById('fullscreenPlayPause').addEventListener('click', function() {
    document.getElementById('playPause').click();
    this.querySelector('i').className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
});

document.getElementById('fullscreenPrev').addEventListener('click', function() {
    document.getElementById('prevSlide').click();
});

document.getElementById('fullscreenNext').addEventListener('click', function() {
    document.getElementById('nextSlide').click();
});

// トランジション速度の制御
document.getElementById('transitionSpeed').addEventListener('input', function() {
    transitionSpeed = this.value;
    document.getElementById('transitionSpeedValue').textContent = this.value + '秒';
    updateTransitionSpeed();
});

// トランジションエフェクトの制御
document.getElementById('transitionEffect').addEventListener('change', function() {
    currentEffect = this.value;
    updateTransitionEffect();
});

// スライドショーサイズの制御
document.getElementById('slideshowSize').addEventListener('change', function() {
    const container = document.getElementById('slideshow-container');
    switch(this.value) {
        case 'small':
            container.style.height = '50vh';
            break;
        case 'normal':
            container.style.height = '80vh';
            break;
        case 'large':
            container.style.height = '90vh';
            break;
    }
});

function updateTransitionSpeed() {
    const images = document.querySelectorAll('#slideshow img');
    images.forEach(img => {
        img.style.transition = `all ${transitionSpeed}s ease-in-out`;
    });
}

function updateTransitionEffect() {
    const currentImage = document.querySelector('#slideshow img');
    if (currentImage) {
        currentImage.className = '';
        if (currentEffect === 'random') {
            currentImage.classList.add(getRandomEffect());
        } else {
            currentImage.classList.add(currentEffect);
        }
    }
}

function showImage(index) {
    const slideshowElement = document.getElementById('slideshow');
    const img = document.createElement('img');
    img.src = URL.createObjectURL(images[index]);
    img.style.transition = `all ${transitionSpeed}s ease-in-out`;
    
    // 現在の画像にエフェクトを適用
    if (slideshowElement.querySelector('img')) {
        const oldImg = slideshowElement.querySelector('img');
        if (currentEffect === 'random') {
            oldImg.classList.add(getRandomEffect());
        } else {
            oldImg.classList.add(currentEffect);
        }
        setTimeout(() => {
            slideshowElement.removeChild(oldImg);
        }, transitionSpeed * 1000);
    }
    
    img.style.opacity = '0';
    slideshowElement.appendChild(img);
    
    setTimeout(() => {
        img.style.opacity = '1';
        img.classList.remove(currentEffect);
    }, 50);
}

// 再生/一時停止の切り替え（同期版）
document.getElementById('playPause').addEventListener('click', function() {
    const icon = this.querySelector('i');
    if (isPlaying) {
        stopSlideshow();
        if (currentAudio) currentAudio.pause();
        if (youtubePlayer) {
            const iframe = document.querySelector('#youtube-container iframe');
            if (iframe) {
                iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
            }
        }
        icon.className = 'fas fa-play';
    } else {
        startSlideshow();
        if (currentAudio) currentAudio.play();
        if (youtubePlayer) {
            const iframe = document.querySelector('#youtube-container iframe');
            if (iframe) {
                iframe.contentWindow.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
            }
        }
        icon.className = 'fas fa-pause';
    }
    isPlaying = !isPlaying;
});

// 次の画像へ
document.getElementById('nextSlide').addEventListener('click', () => {
    if (images.length > 0) {
        currentIndex = (currentIndex + 1) % images.length;
        showImage(currentIndex);
    }
});

// 前の画像へ
document.getElementById('prevSlide').addEventListener('click', () => {
    if (images.length > 0) {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        showImage(currentIndex);
    }
});

// スピード調整
document.getElementById('speedControl').addEventListener('input', function() {
    intervalSpeed = this.value * 1000;
    document.getElementById('timer').textContent = this.value + '秒';
    if (isPlaying) {
        stopSlideshow();
        startSlideshow();
    }
});

// ドラッグ&ドロップ
const dropArea = document.getElementById('dropArea');
dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.style.borderColor = '#1e88e5';
});

dropArea.addEventListener('dragleave', () => {
    dropArea.style.borderColor = '#3d3d3d';
});

dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.style.borderColor = '#3d3d3d';
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        loadImages(files);
    }
});

// 画像ファイル選択を複数可能に修正
document.getElementById('imageUpload').addEventListener('change', function() {
    if (this.files.length > 0) {
        const imageFiles = Array.from(this.files).filter(file => 
            file.type.startsWith('image/') || 
            file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp)$/)
        );
        loadImages(imageFiles);
        this.value = '';
    }
});

// 音楽ファイル選択
document.getElementById('musicUpload').addEventListener('change', function() {
    if (this.files.length > 0) {
        const musicFiles = Array.from(this.files).filter(file => 
            file.type.startsWith('audio/') || 
            file.name.toLowerCase().match(/\.(mp3|wav|ogg|m4a)$/)
        );
        loadMusicPlaylist(musicFiles);
        this.value = '';
    }
});

// YouTube URL入力
document.getElementById('youtubeUrl').addEventListener('change', function() {
    if (this.value) {
        playYouTubePlaylist(this.value);
    }
});

function loadImages(files) {
    // 既存の画像配列に新しい画像を追加
    const newImages = Array.from(files).filter(file => file.type.startsWith('image/'));
    images = [...images, ...newImages];
    
    if (images.length > 0) {
        if (!document.querySelector('#slideshow img')) {
            // 初めての画像読み込み時のみ、最初の画像を表示
            currentIndex = images.length - newImages.length;
            showImage(currentIndex);
        }
        if (!isPlaying) {
            document.getElementById('playPause').click();
        }
    }
}

function startSlideshow() {
    if (images.length > 0) {
        slideInterval = setInterval(() => {
            currentIndex = (currentIndex + 1) % images.length;
            showImage(currentIndex);
        }, intervalSpeed);
    }
}

function stopSlideshow() {
    clearInterval(slideInterval);
}

function playMusic(file) {
    loadMusicPlaylist([file]);
}

function playYouTubePlaylist(url) {
    const videoId = extractVideoId(url);
    if (videoId) {
        const iframe = document.createElement('iframe');
        iframe.width = '300';
        iframe.height = '170';
        // enablejsapiを追加してJavaScript APIを有効化
        iframe.src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=1&playlist=${videoId}&loop=1`;
        iframe.frameBorder = '0';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;

        const container = document.getElementById('youtube-container');
        container.innerHTML = '';
        container.appendChild(iframe);
        
        // YouTubeプレーヤーの状態を管理
        youtubePlayer = true;
        
        // 現在の再生状態に合わせる
        if (!isPlaying) {
            setTimeout(() => {
                iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
            }, 1000);
        }
    } else {
        alert('有効なYouTube URLを入力してください。');
    }
}

function extractVideoId(url) {
    const regex = /(?:https?:\/\/)?(?:www\.)?youtu(?:\.be\/|be\.com\/watch\?v=)([\w\-\_]*)(&(amp;)?[\w\?=]*)?/;
    const match = url.match(regex);
    return match && match[1] ? match[1] : null;
}

// 音量調整
document.getElementById('volumeSlider').addEventListener('input', function() {
    const volume = this.value / 100;
    if (currentAudio) {
        currentAudio.volume = volume;
    }
    document.getElementById('volumeValue').textContent = this.value + '%';
    updateVolumeIcon(volume);
});

// 音量アイコンの更新
function updateVolumeIcon(volume) {
    const icon = document.getElementById('volumeIcon');
    if (volume === 0) {
        icon.className = 'fas fa-volume-mute';
    } else if (volume < 0.5) {
        icon.className = 'fas fa-volume-down';
    } else {
        icon.className = 'fas fa-volume-up';
    }
}

// 音楽プレイリストの読み込み
function loadMusicPlaylist(files) {
    musicPlaylist = files;
    updatePlaylistUI();
    if (musicPlaylist.length > 0) {
        playMusicFromPlaylist(0);
    }
}

// プレイリストUIの更新
function updatePlaylistUI() {
    const playlist = document.getElementById('playlist');
    playlist.innerHTML = '';
    musicPlaylist.forEach((file, index) => {
        const item = document.createElement('div');
        item.className = `playlist-item${index === currentMusicIndex ? ' playing' : ''}`;
        item.innerHTML = `
            <i class="fas ${index === currentMusicIndex ? 'fa-play' : 'fa-music'}"></i>
            <span>${file.name}</span>
        `;
        item.addEventListener('click', () => playMusicFromPlaylist(index));
        playlist.appendChild(item);
    });
}

// プレイリストから音楽を再生
function playMusicFromPlaylist(index) {
    currentMusicIndex = index;
    const file = musicPlaylist[index];
    
    if (currentAudio) {
        currentAudio.pause();
    }
    
    currentAudio = new Audio(URL.createObjectURL(file));
    currentAudio.volume = document.getElementById('volumeSlider').value / 100;
    currentAudio.loop = false;
    
    // 曲が終わったら次の曲を再生
    currentAudio.addEventListener('ended', () => {
        const nextIndex = (currentMusicIndex + 1) % musicPlaylist.length;
        playMusicFromPlaylist(nextIndex);
    });
    
    if (isPlaying) {
        currentAudio.play();
    }
    
    document.getElementById('musicName').textContent = file.name;
    updatePlaylistUI();
}

// 音楽の再生/一時停止を更新
function toggleMusic(shouldPlay) {
    if (currentAudio) {
        if (shouldPlay) {
            currentAudio.play();
        } else {
            currentAudio.pause();
        }
    }
}
