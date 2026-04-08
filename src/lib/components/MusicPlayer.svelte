<script lang="ts">
    import { onMount } from 'svelte';

    let audio: HTMLAudioElement;
    let isPlaying = false;
    let volume = 0.3;
    let showPopup = false;

    onMount(() => {
        // Aggressive autoplay: Start muted (browsers allow this), then unmute
        audio.muted = true;
        audio.play().then(() => {
            isPlaying = true;
            // Unmute after a short delay
            setTimeout(() => {
                audio.muted = false;
                audio.volume = volume;
            }, 100);
        }).catch(() => {
            // If still blocked, try on first user interaction
            const playOnInteraction = () => {
                audio.muted = false;
                audio.volume = volume;
                audio.play().then(() => {
                    isPlaying = true;
                    document.removeEventListener('click', playOnInteraction);
                    document.removeEventListener('touchstart', playOnInteraction);
                });
            };
            document.addEventListener('click', playOnInteraction, { once: true });
            document.addEventListener('touchstart', playOnInteraction, { once: true });
        });
    });

    function togglePlay() {
        if (isPlaying) {
            audio.pause();
            isPlaying = false;
        } else {
            audio.muted = false;
            audio.volume = volume;
            audio.play().then(() => {
                isPlaying = true;
            });
        }
    }

    function handleVolume(e: Event) {
        const target = e.target as HTMLInputElement;
        volume = parseFloat(target.value);
        audio.volume = volume;
    }

    function togglePopup() {
        showPopup = !showPopup;
    }
</script>

<!-- Hidden Audio Element -->
<audio bind:this={audio} src="/music/bg.mp3" loop autoplay></audio>

<!-- Floating Music Button -->
<button class="music-btn" on:click={togglePopup} title="Music Controls">
    {isPlaying ? "🎵" : "🔇"}
</button>

<!-- Popup Overlay -->
{#if showPopup}
    <div
        class="popup-overlay"
        on:click={togglePopup}
        on:keydown={(event) => {
            if (event.key === "Escape" || event.key === "Enter" || event.key === " ") {
                togglePopup();
            }
        }}
        role="button"
        tabindex="0"
        aria-label="Close music controls"
    >
        <div
            class="popup-content"
            on:click|stopPropagation
            on:keydown|stopPropagation
            role="presentation"
        >
            <h3>Music Controls</h3>
            
            <button class="control-btn" on:click={togglePlay}>
                {isPlaying ? "⏸ Pause" : "▶ Play"}
            </button>
            
            <div class="volume-control">
                <span>🔊 Volume</span>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    on:input={handleVolume}
                    class="volume-slider"
                />
                <span class="volume-value">{Math.round(volume * 100)}%</span>
            </div>
        </div>
    </div>
{/if}

<style lang="scss">
    .music-btn {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 54px;
        height: 54px;
        border-radius: 50%;
        border: none;
        background: linear-gradient(135deg, var(--primary, #ff7a18), var(--accent-color, #35d0ff));
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        box-shadow: 0 18px 32px rgba(0, 0, 0, 0.28);
        z-index: 999;
        transition:
            transform 0.3s ease,
            box-shadow 0.3s ease,
            filter 0.3s ease;

        &:hover {
            transform: scale(1.1);
            box-shadow: 0 20px 38px rgba(255, 122, 24, 0.3);
            filter: saturate(1.08);
        }

        &:active {
            transform: scale(0.95);
        }

        @media (max-width: 600px) {
            bottom: 15px;
            right: 15px;
            width: 45px;
            height: 45px;
            font-size: 1.3rem;
        }
    }

    .popup-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 0.2s ease;
    }

    .popup-content {
        background: linear-gradient(180deg, rgba(11, 23, 40, 0.96), rgba(9, 19, 34, 0.94));
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 20px;
        padding: 30px;
        min-width: 280px;
        box-shadow: 0 24px 48px rgba(0, 0, 0, 0.42);
        animation: slideUp 0.3s ease;

        h3 {
            margin: 0 0 20px 0;
            color: white;
            font-size: 1.4rem;
            text-align: center;
        }

        @media (max-width: 600px) {
            min-width: 260px;
            padding: 25px;
        }
    }

    .control-btn {
        width: 100%;
        padding: 12px;
        border: none;
        border-radius: 10px;
        background: linear-gradient(135deg, var(--primary, #ff7a18), var(--primary-strong, #ff9f4a));
        color: white;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        margin-bottom: 20px;
        transition: all 0.2s ease;

        &:hover {
            transform: translateY(-2px);
        }

        &:active {
            transform: translateY(0);
        }
    }

    .volume-control {
        display: flex;
        flex-direction: column;
        gap: 10px;
        color: white;

        span {
            font-size: 0.9rem;
            color: rgba(255, 255, 255, 0.8);
        }

        .volume-value {
            text-align: right;
            font-weight: 600;
            color: var(--accent-color, #35d0ff);
        }
    }

    .volume-slider {
        width: 100%;
        height: 6px;
        -webkit-appearance: none;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
        cursor: pointer;

        &::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 18px;
            height: 18px;
            background: var(--primary, #ff7a18);
            border-radius: 50%;
            cursor: pointer;
            transition: transform 0.2s;

            &:hover {
                transform: scale(1.2);
            }
        }

        &::-moz-range-thumb {
            width: 18px;
            height: 18px;
            background: var(--primary, #ff7a18);
            border-radius: 50%;
            cursor: pointer;
            border: none;
        }
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>
