<script lang="ts">
    import { onMount } from 'svelte';

    let audio: HTMLAudioElement;
    let isPlaying = false;
    let volume = 0.3;

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
</script>

<div class="music-control">
    <audio
        bind:this={audio}
        src="/music/bg.mp3"
        loop
    ></audio>

    <button class="toggle-btn" on:click={togglePlay} title={isPlaying ? "Pause Music" : "Play Music"}>
        {isPlaying ? "🔊" : "🔇"}
    </button>
    
    <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={volume}
        on:input={handleVolume}
        class="volume-slider"
        title="Volume"
    />
</div>

<style lang="scss">
    .music-control {
        position: fixed;
        bottom: 80px; /* Above footer */
        right: 20px;
        display: flex;
        align-items: center;
        gap: 10px;
        background: rgba(18, 18, 18, 0.9);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 50px;
        padding: 10px 15px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        z-index: 999;
        transition: all 0.3s ease;

        &:hover {
            background: rgba(18, 18, 18, 0.95);
            box-shadow: 0 6px 25px rgba(118, 74, 241, 0.3);
        }

        @media (max-width: 600px) {
            bottom: 70px;
            right: 10px;
            left: 10px;
            justify-content: center;
        }
    }

    .toggle-btn {
        border: none;
        background: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s;

        &:hover {
            transform: scale(1.1);
        }

        &:active {
            transform: scale(0.95);
        }
    }

    .volume-slider {
        width: 100px;
        height: 4px;
        -webkit-appearance: none;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
        cursor: pointer;

        &::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 14px;
            height: 14px;
            background: var(--primary, #764af1);
            border-radius: 50%;
            cursor: pointer;
            transition: transform 0.2s;

            &:hover {
                transform: scale(1.2);
            }
        }

        &::-moz-range-thumb {
            width: 14px;
            height: 14px;
            background: var(--primary, #764af1);
            border-radius: 50%;
            cursor: pointer;
            border: none;
        }

        @media (max-width: 600px) {
            flex: 1;
            max-width: 150px;
        }
    }
</style>

