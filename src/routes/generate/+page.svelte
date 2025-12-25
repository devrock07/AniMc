<script lang="ts">
    // @ts-ignore
    import { onMount } from "svelte";
    import SaveButton from "@components/SaveButton.svelte";
    import ArrowButton from "@components/ArrowButton.svelte";
    import Popup from "@components/Popup.svelte";
    import SEO from "@components/SEO.svelte";
    import changeGradient from "@scripts/gradients";
    import generatePfp from "@scripts/generateProfile";
    import { mergeCanvases } from "@scripts/utils";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";

    const urlSearchParamIGN = $page.url.searchParams.get("ign") || null;

    let username = "";
    let firefoxPopup = false;
    let isLoading = false;

    let gradientCanvas: HTMLCanvasElement;
    let gradientCtx: CanvasRenderingContext2D;
    let profileCanvas: HTMLCanvasElement;
    let profileCtx: CanvasRenderingContext2D;

    onMount(async () => {
        if (!urlSearchParamIGN)
            goto("/generate?ign=makima", { replaceState: false });
        else username = urlSearchParamIGN.replace(/[^a-z0-9_]/gi, "");

        gradientCanvas = window.document.getElementById(
            "gradientCanvas",
        ) as HTMLCanvasElement;
        gradientCanvas.width = 300;
        gradientCanvas.height = 300;
        gradientCtx = gradientCanvas.getContext("2d");
        gradientCtx.scale(16, 16);
        gradientCtx.imageSmoothingEnabled = false;
        changeGradient(gradientCtx);

        profileCanvas = window.document.getElementById(
            "profileCanvas",
        ) as HTMLCanvasElement;
        profileCanvas.width = 300;
        profileCanvas.height = 300;
        profileCtx = profileCanvas.getContext("2d");
        profileCtx.scale(16, 16);
        profileCtx.imageSmoothingEnabled = false;

        await updatePfp();
    });

    async function updatePfp() {
        isLoading = true;
        await generatePfp(
            `https://minotar.net/skin/${username || "makima"}.png`,
            profileCtx,
        );
        isLoading = false;
    }

    async function savePicture() {
        const merged = await mergeCanvases([gradientCanvas, profileCanvas]);
        const link = document.createElement("a");
        link.download = `AniMc - ${username || "unknown"}.png`;
        link.href = merged.toDataURL();
        link.click();
    }

    async function copyPicture() {
        if (navigator.userAgent.indexOf("Firefox") != -1) {
            if (!firefoxPopup) {
                firefoxPopup = true;
                setTimeout(() => (firefoxPopup = false), 5000);
            }
        } else {
            const merged = await mergeCanvases([gradientCanvas, profileCanvas]);
            merged.toBlob(function (blob) {
                const item = new ClipboardItem({ "image/png": blob });
                navigator.clipboard.write([item]);
            });
        }
    }

    let timeout;
    async function validateInput(e) {
        username = username.replace(/[^a-z0-9_]/gi, "");

        try {
            await generatePfp(
                `https://minotar.net/skin/${username}.png`,
                profileCtx,
            );

            clearTimeout(timeout);
            timeout = setTimeout(async () => {
                await generatePfp(
                    `https://minotar.net/skin/${username}.png`,
                    profileCtx,
                );
                goto(`/generate?ign=${username}`, {
                    replaceState: true,
                    keepFocus: true,
                });
            }, 300);
        } catch (e) {
            await generatePfp(null, profileCtx);
        }
    }
</script>

<SEO
    description="Generate a free profile picture for {urlSearchParamIGN}!"
    username={urlSearchParamIGN}
/>

<div class="generate-container">
    <div class="glass-card">
        <h2 class="card-title">Profile Generator</h2>

        <div class="input-group">
            <input
                type="text"
                spellcheck="false"
                maxlength="16"
                pattern="[a-zA-Z0-9_]+"
                bind:value={username}
                on:input={validateInput}
                placeholder="Minecraft Username"
            />
            <div class="underline"></div>
        </div>

        <div class="preview-area">
            <div class="controls left">
                <ArrowButton
                    on:click={() => changeGradient(gradientCtx, "left")}
                    orientation="left"
                />
            </div>

            <div class="canvas-wrapper">
                <div class="canvas-stack">
                    <canvas id="gradientCanvas" />
                    <canvas id="profileCanvas" />
                </div>
            </div>

            <div class="controls right">
                <ArrowButton
                    on:click={() => changeGradient(gradientCtx, "right")}
                    orientation="right"
                />
            </div>
        </div>

        <div class="actions">
            <div
                class="btn-wrap"
                on:click={savePicture}
                on:keydown={savePicture}
                role="button"
                tabindex="0"
            >
                <SaveButton text="Download" />
            </div>
            <div
                class="btn-wrap"
                on:click={copyPicture}
                on:keydown={copyPicture}
                role="button"
                tabindex="0"
            >
                <SaveButton text="Copy" />
            </div>
        </div>
    </div>

    {#if firefoxPopup}
        <Popup type="failed" message="Firefox does not support this :(" />
    {/if}
</div>

<style lang="scss">
    .generate-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: calc(100vh - 80px - 80px);
        padding: 2rem;
    }

    .glass-card {
        background: rgba(18, 18, 18, 0.6);
        backdrop-filter: blur(16px);
        border: 1px solid var(--glass-border);
        border-radius: 24px;
        padding: 4rem;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3rem;
        width: 100%;
        max-width: 600px;
        animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .card-title {
        font-size: 3.2rem;
        font-weight: 700;
        margin: 0;
        background: linear-gradient(
            135deg,
            var(--primary) 0%,
            var(--accent-color) 100%
        );
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .input-group {
        position: relative;
        width: 100%;
        max-width: 300px;

        input {
            width: 100%;
            background: transparent;
            border: none;
            border-bottom: 2px solid rgba(255, 255, 255, 0.1);
            padding: 1rem;
            font-size: 2rem;
            text-align: center;
            color: var(--text-main);
            font-family: var(--font-main);
            transition: all 0.3s ease;

            &:focus {
                outline: none;
                border-color: var(--primary);
            }

            &::placeholder {
                color: var(--text-muted);
                opacity: 0.5;
            }
        }
    }

    .preview-area {
        display: flex;
        align-items: center;
        gap: 2rem;

        @media (max-width: 600px) {
            flex-direction: column;
        }
    }

    .canvas-wrapper {
        position: relative;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 24px;
        border: 1px solid var(--glass-border);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);

        .canvas-stack {
            position: relative;
            width: 300px;
            height: 300px;

            canvas {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border-radius: 16px;
            }
        }
    }

    .actions {
        display: flex;
        gap: 2rem;
        margin-top: 1rem;
    }

    // Wrapper to catch clicks for the component
    .btn-wrap {
        cursor: pointer;
    }

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(40px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>
