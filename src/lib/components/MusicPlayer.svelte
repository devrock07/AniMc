<script lang="ts">
    import { onMount } from 'svelte';

    let audio: HTMLAudioElement;
    let isPlaying = false;
    let volume = 0.3;
    let showPopup = false;

    onMount(() => {
        playAudio();
    });

    function togglePlay() {
        if (isPlaying) {
            audio.pause();
            isPlaying = false;
        } else {
            audio.play();
            isPlaying = true;
        }
    }

    function playAudio() {
        audio.play().then(() => {
            isPlaying = true;
        }).catch(() => {
            isPlaying = false;
        });
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
<audio bind:this={audio} src="/music/bg.mp3" loop></audio>

<!-- Floating Music Button -->
<button class="music-btn" on:click={togglePopup} title="Music Controls">
    {isPlaying ? "🎵" : "🔇"}
</button>

<!-- Popup Overlay -->
{#if showPopup}
    <div class="popup-overlay" on:click={togglePopup}>
        <div class="popup-content" on:click|stopPropagation>
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
        width: 50px;
        height: 50px;
        border-radius: 50%;
        border: none;
        background: linear-gradient(135deg, var(--primary, #764af1), #9d7bf5);
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(118, 74, 241, 0.4);
        z-index: 999;
        transition: all 0.3s ease;

        &:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 20px rgba(118, 74, 241, 0.6);
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
        background: rgba(18, 18, 18, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 20px;
        padding: 30px;
        min-width: 280px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
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
        background: var(--primary, #764af1);
        color: white;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        margin-bottom: 20px;
        transition: all 0.2s ease;

        &:hover {
            background: var(--primary-hover, #5e35d8);
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
            color: var(--primary, #764af1);
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
            background: var(--primary, #764af1);
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
            background: var(--primary, #764af1);
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

