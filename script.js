/* ======================================
   SOUND DATA & COLOR MAPPING
====================================== */
const sounds = [
    { id: 'rain', name: 'Rain', icon: '🌧️', color: '#4fd1c5', particleType: 'rain' },
    { id: 'thunder', name: 'Thunder', icon: '⛈️', color: '#94a3b8', particleType: 'none' },
    { id: 'wind', name: 'Wind', icon: '🌬️', color: '#a5b4fc', particleType: 'wind' },
    { id: 'forest', name: 'Forest', icon: '🌲', color: '#10b981', particleType: 'leaf' },
    { id: 'night', name: 'Night', icon: '🌙', color: '#a5b8d8', particleType: 'star' },
    { id: 'river', name: 'River', icon: '🌊', color: '#0ea5e9', particleType: 'bubble' },
    { id: 'train', name: 'Train', icon: '🚆', color: '#64748b', particleType: 'smoke' },
    { id: 'fire', name: 'Campfire', icon: '🔥', color: '#f97316', particleType: 'ember' }
];

const presets = {
    focus: { rain: 0.2, wind: 0.1 },
    sleep: { night: 0.2, wind: 0.1, fire: 0.4 },
    rainyNight: { rain: 1, thunder: 0.7, wind: 0.2 },
    forestCalm: { forest: 0.5, wind: 0.1 },
    meditation: { river: 0.3, forest: 0.2, wind: 0.1}
};

/* ======================================
   AUDIO UNLOCK
====================================== */
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

/* ======================================
   PARTICLE SYSTEM
====================================== */

const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
const particles = [];
const MAX_PARTICLES = 150;

// Lightning flash system - Distant Sky Illumination
let lightningFlash = null;
let lastLightningTime = 0;
let nextLightningDelay = 0;

class DistantLightning {
    constructor(intensity) {
        // Random position along horizon
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height * 0.3; // Top 30% of screen
        this.radius = 200 + intensity * 400; // Larger glow for more intense thunder
        this.maxOpacity = 0.3 + intensity * 0.4; // Max 0.7 opacity
        this.opacity = this.maxOpacity;
        this.fadeSpeed = 0.03 + intensity * 0.02;
        this.color = Math.random() < 0.5 ? 'blue' : 'purple'; // Alternate colors
    }
    
    update() {
        this.opacity -= this.fadeSpeed;
        return this.opacity > 0;
    }
    
    draw() {
        if (this.opacity <= 0) return;
        
        ctx.save();
        
        // Create radial gradient for distant glow
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius
        );
        
        // Choose color scheme
        if (this.color === 'blue') {
            gradient.addColorStop(0, `rgba(147, 197, 253, ${this.opacity})`); // Light blue
            gradient.addColorStop(0.3, `rgba(59, 130, 246, ${this.opacity * 0.6})`); // Blue
            gradient.addColorStop(0.6, `rgba(30, 64, 175, ${this.opacity * 0.3})`); // Dark blue
            gradient.addColorStop(1, 'rgba(30, 64, 175, 0)');
        } else {
            gradient.addColorStop(0, `rgba(196, 181, 253, ${this.opacity})`); // Light purple
            gradient.addColorStop(0.3, `rgba(139, 92, 246, ${this.opacity * 0.6})`); // Purple
            gradient.addColorStop(0.6, `rgba(88, 28, 135, ${this.opacity * 0.3})`); // Dark purple
            gradient.addColorStop(1, 'rgba(88, 28, 135, 0)');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.restore();
    }
}

// Smooth gradient color transition
let currentGradientColor = { r: 15, g: 23, b: 42 };
let targetGradientColor = { r: 15, g: 23, b: 42 };
let currentIntensity = 0.3;
let targetIntensity = 0.3;
let initialGradientSet = false; // Track if initial gradient has been set

// Resize canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Particle class
class Particle {
    constructor(type, color) {
        this.type = type;
        this.color = color;
        this.fadingOut = false;
        this.reset();
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = this.getSize();
        this.speedX = this.getSpeedX();
        this.speedY = this.getSpeedY();
        this.opacity = Math.random() * 0.5 + 0.3;
        this.life = 1;
        this.fadingOut = false;
    }

    getSize() {
        switch(this.type) {
            case 'rain': return Math.random() * 2 + 1;
            case 'lightning': return Math.random() * 3 + 2;
            case 'wind': return Math.random() * 2 + 0.5;
            case 'leaf': return Math.random() * 3 + 2;
            case 'star': return Math.random() * 2 + 1;
            case 'bubble': return Math.random() * 3 + 1.5;
            case 'smoke': return Math.random() * 4 + 2;
            case 'ember': return Math.random() * 3 + 1.5;
            default: return 2;
        }
    }

    getSpeedX() {
        switch(this.type) {
            case 'rain': return Math.random() * 0.5 - 0.25;
            case 'wind': return Math.random() * 2 + 1;
            case 'leaf': return Math.random() * 1 - 0.5;
            case 'smoke': return Math.random() * 0.4 - 0.2;
            case 'ember': return Math.random() * 0.3 - 0.15;
            default: return Math.random() * 0.5 - 0.25;
        }
    }

    getSpeedY() {
        switch(this.type) {
            case 'rain': return Math.random() * 3 + 2;
            case 'lightning': return Math.random() * 4 + 3;
            case 'wind': return Math.random() * 0.5 - 0.25;
            case 'leaf': return Math.random() * 1 + 0.5;
            case 'star': return Math.random() * 0.2 - 0.1;
            case 'bubble': return -Math.random() * 1.5 - 0.5;
            case 'smoke': return -Math.random() * 1 - 0.5;
            case 'ember': return -Math.random() * 2 - 1;
            default: return Math.random() * 1;
        }
    }

    update() {
        // Handle fade-out
        if (this.fadingOut) {
            this.life -= 0.02;
            if (this.life <= 0) {
                return 'remove'; // Signal for removal
            }
            // Continue moving while fading
            this.x += this.speedX * 0.5;
            this.y += this.speedY * 0.5;
            return;
        }

        this.x += this.speedX;
        this.y += this.speedY;

        // Special behaviors
        if (this.type === 'leaf' || this.type === 'wind') {
            this.x += Math.sin(this.y * 0.01) * 0.5;
        }

        if (this.type === 'star') {
            this.opacity = 0.4 + Math.sin(Date.now() * 0.002 + this.x) * 0.4;
        }

        if (this.type === 'ember') {
            this.size *= 0.995;
            this.life -= 0.005;
        }

        // Reset when out of bounds or life expired
        if (this.y < -10 || this.y > canvas.height + 10 || 
            this.x < -10 || this.x > canvas.width + 10 ||
            this.life <= 0) {
            this.reset();
        }
    }

    startFadeOut() {
        this.fadingOut = true;
    }

    draw() {
        if (this.type === 'none') return; // Don't draw thunder particles
        
        ctx.save();
        ctx.globalAlpha = this.opacity * this.life;

        switch(this.type) {
            case 'rain':
                ctx.strokeStyle = this.color;
                ctx.lineWidth = this.size;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x + this.speedX * 2, this.y + this.speedY * 3);
                ctx.stroke();
                break;

            case 'lightning':
                // Lightning is handled by screen flashes, not individual particles
                break;

            case 'wind':
            case 'smoke':
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'leaf':
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.ellipse(this.x, this.y, this.size * 1.5, this.size, Math.PI / 4, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'star':
                ctx.fillStyle = this.color;
                ctx.shadowBlur = 15;
                ctx.shadowColor = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
                ctx.fill();
                // Add extra glow
                ctx.shadowBlur = 25;
                ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size * 0.8, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'bubble':
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.stroke();
                break;

            case 'ember':
                ctx.fillStyle = this.color;
                ctx.shadowBlur = 20;
                ctx.shadowColor = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                break;

            default:
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
        }

        ctx.restore();
    }
}

// Lightning bolt mechanics
function triggerLightning(intensity) {
    const now = Date.now();
    
    // Random delays between 3-8 seconds, scaled by intensity
    if (now - lastLightningTime > nextLightningDelay) {
        // Create new distant lightning flash
        lightningFlash = new DistantLightning(intensity);
        
        // Sometimes create a quick follow-up flash (double flash)
        if (Math.random() < 0.3) {
            setTimeout(() => {
                if (lightningFlash && lightningFlash.opacity < 0.1) {
                    lightningFlash = new DistantLightning(intensity * 0.6);
                }
            }, 150 + Math.random() * 200);
        }
        
        lastLightningTime = now;
        // Next flash in 3-8 seconds (shorter delays with higher volume)
        nextLightningDelay = (3000 + Math.random() * 5000) / (0.5 + intensity);
    }
}

function updateAndDrawLightning() {
    // Update and draw active lightning flash
    if (lightningFlash) {
        const stillActive = lightningFlash.update();
        
        if (stillActive) {
            lightningFlash.draw();
        } else {
            lightningFlash = null;
        }
    }
}

// Particle management
function updateParticles() {
    const activeVolumes = getActiveVolumes();
    const targetParticleCounts = calculateParticleDistribution(activeVolumes);

    // Adjust particle pool
    adjustParticlePool(targetParticleCounts);

    // Update gradient
    updateGradient(activeVolumes);
}

function getActiveVolumes() {
    const volumes = {};
    sounds.forEach(sound => {
        const audio = document.getElementById(`audio-${sound.id}`);
        if (audio && audio.volume > 0) {
            volumes[sound.id] = audio.volume;
        }
    });
    return volumes;
}

function calculateParticleDistribution(activeVolumes) {
    const distribution = {};
    const totalVolume = Object.values(activeVolumes).reduce((sum, vol) => sum + vol, 0);

    if (totalVolume === 0) return distribution;

    sounds.forEach(sound => {
        const volume = activeVolumes[sound.id] || 0;
        const ratio = volume / totalVolume;
        distribution[sound.id] = Math.floor(ratio * MAX_PARTICLES);
    });

    return distribution;
}

function adjustParticlePool(targetCounts) {
    const currentCounts = {};
    
    // Count existing particles (excluding those fading out)
    particles.forEach(p => {
        if (!p.fadingOut) {
            const sound = sounds.find(s => s.particleType === p.type);
            if (sound) {
                currentCounts[sound.id] = (currentCounts[sound.id] || 0) + 1;
            }
        }
    });

    // If user hasn't interacted yet and no sounds are playing, maintain initial particles
    if (!hasInteracted && Object.keys(targetCounts).length === 0) {
        const initialCounts = {
            'rain': 30,
            'forest': 20,
            'river': 25
        };
        
        // Maintain initial particle counts
        Object.entries(initialCounts).forEach(([soundId, targetCount]) => {
            const sound = sounds.find(s => s.id === soundId);
            if (sound) {
                const current = currentCounts[soundId] || 0;
                const diff = targetCount - current;
                
                if (diff > 0) {
                    for (let i = 0; i < diff; i++) {
                        particles.push(new Particle(sound.particleType, sound.color));
                    }
                }
            }
        });
        return;
    }
    
    // Clear all initial particles on first interaction
    if (!hasInteracted && Object.keys(targetCounts).length > 0) {
        hasInteracted = true;
        // Mark all existing particles for fade-out
        particles.forEach(p => {
            if (!p.fadingOut) {
                p.startFadeOut();
            }
        });
    }

    // Add/remove particles based on active sounds
    sounds.forEach(sound => {
        const target = targetCounts[sound.id] || 0;
        const current = currentCounts[sound.id] || 0;
        const diff = target - current;

        if (diff > 0) {
            // Add particles
            for (let i = 0; i < diff; i++) {
                particles.push(new Particle(sound.particleType, sound.color));
            }
        } else if (diff < 0) {
            // Mark particles for fade-out instead of instant removal
            const toRemove = -diff;
            let marked = 0;
            for (let i = particles.length - 1; i >= 0 && marked < toRemove; i--) {
                if (particles[i].type === sound.particleType && !particles[i].fadingOut) {
                    particles[i].startFadeOut();
                    marked++;
                }
            }
        }
    });
}

function updateGradient(activeVolumes) {
    // Maintain initial gradient until user interacts
    if (!hasInteracted && initialGradientSet) {
        return; // Keep the initial gradient
    }
    
    if (Object.keys(activeVolumes).length === 0) {
        targetGradientColor = { r: 15, g: 23, b: 42 };
        targetIntensity = 0.3;
        return;
    }

    // Calculate weighted average color
    let totalVolume = 0;
    let r = 0, g = 0, b = 0;

    sounds.forEach(sound => {
        const volume = activeVolumes[sound.id] || 0;
        if (volume > 0) {
            totalVolume += volume;
            const rgb = hexToRgb(sound.color);
            r += rgb.r * volume;
            g += rgb.g * volume;
            b += rgb.b * volume;
        }
    });

    if (totalVolume > 0) {
        targetGradientColor.r = Math.round(r / totalVolume);
        targetGradientColor.g = Math.round(g / totalVolume);
        targetGradientColor.b = Math.round(b / totalVolume);
    }

    // Set target intensity
    targetIntensity = Math.min(totalVolume / 2, 0.4);
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 79, g: 209, b: 197 };
}

// Smooth color interpolation
function lerpColor() {
    const lerpSpeed = 0.03; // Adjust for faster/slower transitions (0.01 = very slow, 0.1 = fast)
    
    // Lerp RGB values
    currentGradientColor.r += (targetGradientColor.r - currentGradientColor.r) * lerpSpeed;
    currentGradientColor.g += (targetGradientColor.g - currentGradientColor.g) * lerpSpeed;
    currentGradientColor.b += (targetGradientColor.b - currentGradientColor.b) * lerpSpeed;
    
    // Lerp intensity
    currentIntensity += (targetIntensity - currentIntensity) * lerpSpeed;
    
    // Apply to gradient overlay
    const gradientOverlay = document.getElementById('gradient-overlay');
    const r = Math.round(currentGradientColor.r);
    const g = Math.round(currentGradientColor.g);
    const b = Math.round(currentGradientColor.b);
    
    gradientOverlay.style.background = `radial-gradient(circle at center, rgba(${r}, ${g}, ${b}, ${currentIntensity}) 0%, rgba(5, 7, 10, 0.8) 100%)`;
}

// Animation loop
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Smooth color transition
    lerpColor();

    // Check for thunder and trigger lightning ONLY when volume is above threshold
    const thunderAudio = document.getElementById('audio-thunder');
    if (thunderAudio && thunderAudio.volume > 0.05) {
        triggerLightning(thunderAudio.volume);
    } else {
        // Clear lightning when thunder is off or very low
        lightningFlash = null;
    }

    // Update and draw particles, removing fully faded ones
    for (let i = particles.length - 1; i >= 0; i--) {
        const result = particles[i].update();
        if (result === 'remove') {
            particles.splice(i, 1);
        } else {
            particles[i].draw();
        }
    }

    // Draw lightning flash on top
    updateAndDrawLightning();

    requestAnimationFrame(animate);
}

/* ======================================
   INITIALIZATION
====================================== */
let hasInteracted = false; // Track if user has interacted with sounds

// Initialize audio elements and start animation when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    // Ensure all audio elements start at volume 0
    sounds.forEach(s => {
        const audio = document.getElementById(`audio-${s.id}`);
        if (audio) {
            audio.volume = 0;
            audio.loop = true;
        }
    });
    
    // Set initial blue gradient for default water theme
    setInitialGradient();
    
    // Create initial default particles (rain, forest, river)
    createInitialParticles();
    
    // Start animation loop
    animate();
});

// Set initial water-themed gradient
function setInitialGradient() {
    // Use river/water color as the initial gradient
    const waterColor = hexToRgb('#0ea5e9'); // River color
    currentGradientColor = { r: waterColor.r, g: waterColor.g, b: waterColor.b };
    targetGradientColor = { r: waterColor.r, g: waterColor.g, b: waterColor.b };
    currentIntensity = 0.35;
    targetIntensity = 0.35;
    
    // Apply immediately
    const gradientOverlay = document.getElementById('gradient-overlay');
    gradientOverlay.style.background = `radial-gradient(circle at center, rgba(${waterColor.r}, ${waterColor.g}, ${waterColor.b}, 0.35) 0%, rgba(5, 7, 10, 0.8) 100%)`;
}

// Create initial decorative particles
function createInitialParticles() {
    const defaultEffects = [
        { type: 'rain', color: '#4fd1c5', count: 30 },
        { type: 'leaf', color: '#10b981', count: 20 },
        { type: 'bubble', color: '#0ea5e9', count: 25 }
    ];
    
    defaultEffects.forEach(effect => {
        for (let i = 0; i < effect.count; i++) {
            particles.push(new Particle(effect.type, effect.color));
        }
    });
    
    // Set initial gradient (blend of water blue and forest green)
    // Water: #0ea5e9 (14, 165, 233)
    // Forest: #10b981 (16, 185, 129)
    // Blend: slightly more blue with hint of green
    targetGradientColor = { r: 15, g: 175, b: 190 };
    currentGradientColor = { r: 15, g: 175, b: 190 };
    targetIntensity = 0.35;
    currentIntensity = 0.35;
    initialGradientSet = true;
}

/* ======================================
   GRID INITIALIZATION
====================================== */
const grid = document.getElementById('sound-grid');

sounds.forEach(sound => {
    const card = document.createElement('div');
    card.className = 'sound-card';
    card.id = `card-${sound.id}`;
    card.style.setProperty('--card-accent', sound.color);
    card.style.setProperty('--card-glow', sound.color + '40');

    card.innerHTML = `
        <div class="icon">${sound.icon}</div>
        <div class="name">${sound.name}</div>
        <input type="range" min="0" max="1" step="0.01" value="0">
    `;

    const slider = card.querySelector('input');

    // Slider control
    slider.addEventListener('input', e => {
        updateVolume(sound.id, e.target.value);
        updateParticles();
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

        updateParticles();
    });

    grid.appendChild(card);
});

/* ======================================
   VOLUME HANDLING
====================================== */
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

/* ======================================
   GLOBAL PLAY / PAUSE
====================================== */
function toggleAll() {
    unlockAudio();

    const btn = document.getElementById('master-play-pause');

    if (!isPaused) {
        // ⏸ PAUSE ALL
        sounds.forEach(s => {
            const audio = document.getElementById(`audio-${s.id}`);

            if (!audio.paused && audio.volume > 0) {
                pausedVolumes[s.id] = audio.volume;

                fadeAudio(audio, 0);
                setTimeout(() => {
                    audio.pause();
                }, 350);
            }
        });

        btn.innerText = "Resume All";
        isPaused = true;

    } else {
        // ▶️ RESUME ALL
        sounds.forEach(s => {
            const audio = document.getElementById(`audio-${s.id}`);
            const slider = document.querySelector(`#card-${s.id} input`);
            const card = document.getElementById(`card-${s.id}`);

            const vol = pausedVolumes[s.id];

            if (vol !== undefined && vol > 0) {
                audio.volume = 0;
                audio.play();
                slider.value = vol;
                fadeAudio(audio, vol);
                card.classList.add('active');
            }
        });

        btn.innerText = "Pause All";
        isPaused = false;
    }

    updateParticles();
}

/* ======================================
   RESET MIX
====================================== */
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

    updateParticles();
}

/* ======================================
   PRESETS
====================================== */
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
        updateParticles();
    }, 120);
}

/* ======================================
   SAFE FADE
====================================== */
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

// Update particles periodically (in case of manual adjustments)
setInterval(updateParticles, 500);