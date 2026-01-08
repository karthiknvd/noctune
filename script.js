/* ------------------------------
   SOUND DATA
------------------------------ */
const sounds = [
    { id: 'rain', name: 'Rain', icon: '🌧️' },
    { id: 'thunder', name: 'Thunder', icon: '⛈️' },
    { id: 'wind', name: 'Wind', icon: '🌬️' },
    { id: 'forest', name: 'Forest', icon: '🌲' },
    { id: 'night', name: 'Night', icon: '🌙' },
    { id: 'river', name: 'River', icon: '🌊' },
    { id: 'train', name: 'Train', icon: '🚆' },
    { id: 'fire', name: 'Campfire', icon: '🔥' }
];

const presets = {
    focus: { rain: 0.2, wind: 0.1 },
    sleep: { night: 0.2, wind: 0.1, fire: 0.4 },
    rainyNight: { rain: 1, thunder: 0.7, wind: 0.2 },
    forestCalm: { forest: 0.5, wind: 0.1 },
    meditation: { river: 0.3, forest: 0.2, wind: 0.1}
};

/* ------------------------------
   AUDIO UNLOCK
------------------------------ */
let audioUnlocked = false;
const pausedVolumes = {};
let isPaused = false;
let applyingPreset = false;

function unlockAudio() {
    if (audioUnlocked) return;

    sounds.forEach(s => {
        const audio = document.getElementById(`audio-${s.id}`);
        audio.volume = 0;
        audio.play().catch(() => {});
    });

    audioUnlocked = true;
}

document.addEventListener('pointerdown', unlockAudio, { once: true });

/* ------------------------------
   GRID INITIALIZATION
------------------------------ */
const grid = document.getElementById('sound-grid');

sounds.forEach(sound => {
    const card = document.createElement('div');
    card.className = 'sound-card';
    card.id = `card-${sound.id}`;

    card.innerHTML = `
        <div class="icon">${sound.icon}</div>
        <div class="name">${sound.name}</div>
        <input type="range" min="0" max="1" step="0.01" value="0">
    `;

    const slider = card.querySelector('input');

    // Slider control
    slider.addEventListener('input', e => {
        updateVolume(sound.id, e.target.value);
    });

    // Card click toggle (0 ↔ 0.5)
    card.addEventListener('click', e => {
        if (e.target.tagName === 'INPUT') return;

        unlockAudio();

        const audio = document.getElementById(`audio-${sound.id}`);

        if (audio.volume > 0) {
            fadeAudio(audio, 0);
            slider.value = 0;
            card.classList.remove('active');
        } else {
            audio.play();
            slider.value = 0.5;
            fadeAudio(audio, 0.5);
            card.classList.add('active');
        }
    });

    grid.appendChild(card);
});

/* ------------------------------
   VOLUME HANDLING
------------------------------ */
function updateVolume(id, value) {
    unlockAudio();

    const audio = document.getElementById(`audio-${id}`);
    const card = document.getElementById(`card-${id}`);
    const vol = parseFloat(value);

    audio.volume = vol;

    if (vol > 0) {
        audio.play();
        card.classList.add('active');
    } else {
        card.classList.remove('active');
    }
}

/* ------------------------------
   GLOBAL PLAY / PAUSE (NO MEMORY)
------------------------------ */
function toggleAll() {
    unlockAudio();

    const btn = document.getElementById('master-play-pause');

    if (!isPaused) {
        // ⏸ PAUSE ALL (fade out + remember volumes)
        sounds.forEach(s => {
            const audio = document.getElementById(`audio-${s.id}`);

            if (!audio.paused && audio.volume > 0) {
                pausedVolumes[s.id] = audio.volume;

                fadeAudio(audio, 0);
                setTimeout(() => {
                    audio.pause();
                }, 350); // matches fade duration
            }
        });

        btn.innerText = "Resume All";
        isPaused = true;

    } else {
        // ▶️ RESUME ALL (fade in smoothly)
        sounds.forEach(s => {
            const audio = document.getElementById(`audio-${s.id}`);
            const slider = document.querySelector(`#card-${s.id} input`);
            const card = document.getElementById(`card-${s.id}`);

            const vol = pausedVolumes[s.id];

            if (vol !== undefined && vol > 0) {
                audio.volume = 0;     // start silent
                audio.play();
                slider.value = vol;
                fadeAudio(audio, vol);
                card.classList.add('active');
            }
        });

        btn.innerText = "Pause All";
        isPaused = false;
    }
}


/* ------------------------------
   RESET MIX
------------------------------ */
function resetMix() {
    isPaused = false;
    for (const key in pausedVolumes) delete pausedVolumes[key];

    sounds.forEach(s => {
        const audio = document.getElementById(`audio-${s.id}`);
        const slider = document.querySelector(`#card-${s.id} input`);
        const card = document.getElementById(`card-${s.id}`);

        if (audio._fadeInterval) {
            clearInterval(audio._fadeInterval);
            audio._fadeInterval = null;
        }

        fadeAudio(audio, 0);

if (!applyingPreset) {
    setTimeout(() => audio.pause(), 300);
} else {
    audio.pause();
}

        slider.value = 0;
        card.classList.remove('active');
    });
}

/* ------------------------------
   PRESETS
------------------------------ */
function applyPreset(presetKey) {
    applyingPreset = true;

    unlockAudio();
    resetMix();

    const config = presets[presetKey];

    setTimeout(() => {
        for (const [id, volume] of Object.entries(config)) {
            const audio = document.getElementById(`audio-${id}`);
            const slider = document.querySelector(`#card-${id} input`);
            const card = document.getElementById(`card-${id}`);

            audio.play();
            slider.value = volume;
            fadeAudio(audio, volume);
            card.classList.add('active');
        }

        applyingPreset = false;
    }, 120);
}

/* ------------------------------
   SAFE FADE
------------------------------ */
function fadeAudio(audio, targetVolume) {
    const step = 0.04;
    const interval = 40;

    if (audio._fadeInterval) {
        clearInterval(audio._fadeInterval);
    }

    audio._fadeInterval = setInterval(() => {
        const diff = targetVolume - audio.volume;

        if (Math.abs(diff) <= step) {
            audio.volume = targetVolume;
            clearInterval(audio._fadeInterval);
            audio._fadeInterval = null;
            return;
        }

        audio.volume += diff > 0 ? step : -step;
    }, interval);
}