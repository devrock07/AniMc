<script lang="ts">
    // @ts-ignore
    import { onMount } from "svelte";
    import SaveButton from "@components/SaveButton.svelte";
    import ArrowButton from "@components/ArrowButton.svelte";
    import Popup from "@components/Popup.svelte";
    import SEO from "@components/SEO.svelte";
    import { changeGradient, drawCustomGradient, drawCustomImage } from "@scripts/gradients";
    import generatePfp from "@scripts/generateProfile";
    import { mergeCanvases, loadImage } from "@scripts/utils";
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

    // Background State
    let bgMode: "presets" | "gradient" | "upload" = "presets";
    let color1 = "#00cdac";
    let color2 = "#02aab0";
    let customBgImage: HTMLImageElement | null = null;

    // Input Mode State
    let inputMode: "java" | "upload" = "java";
    let customSkinData: string | null = null;


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

    async function handleFileUpload(e: Event) {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const result = e.target?.result as string;
            customSkinData = result;
            isLoading = true;
            await generatePfp(result, profileCtx);
            isLoading = false;
        };
        reader.readAsDataURL(file);
    }

    async function handleBgUpload(e: Event) {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const result = e.target?.result as string;
            customBgImage = await loadImage(result);
            updateBackground();
        };
        reader.readAsDataURL(file);
    }

    function updateBackground() {
        if (bgMode === "presets") {
            changeGradient(gradientCtx);
        } else if (bgMode === "gradient") {
            drawCustomGradient(gradientCtx, [color1, color2]);
        } else if (bgMode === "upload" && customBgImage) {
            drawCustomImage(gradientCtx, customBgImage);
        }
    }


    async function toggleMode(mode: "java" | "upload") {
        inputMode = mode;
        if (mode === "java") {
            await validateInput(null);
        } else if (customSkinData) {
            isLoading = true;
            await generatePfp(customSkinData, profileCtx);
            isLoading = false;
        }
    }

    function setBgMode(mode: "presets" | "gradient" | "upload") {
        bgMode = mode;
        updateBackground();
    }
</script>

<SEO 
    title="Generate Minecraft PFP - Free Custom Profile Picture Maker | AniMc"
    description="Create your custom Minecraft profile picture now! Upload your skin, choose gradients, and download your unique PFP for Discord, social media, and gaming profiles. 100% free, no watermark."
    username={urlSearchParamIGN || "makima"}
    url="https://ani-mc.vercel.app/generate"
/>

<div class="generate-container">
    <div class="glass-card">
        <h2 class="card-title">Profile Generator</h2>

        <div class="mode-toggle">
            <button
                class:active={inputMode === "java"}
                on:click={() => toggleMode("java")}
            >
                Java Username
            </button>
            <button
                class:active={inputMode === "upload"}
                on:click={() => toggleMode("upload")}
            >
                Upload Skin
            </button>
        </div>

        <div class="input-group">
            {#if inputMode === "java"}
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
            {:else}
                <label class="file-upload">
                    <span>Click to Upload Skin</span>
                    <input
                        type="file"
                        accept=".png"
                        on:change={handleFileUpload}
                    />
                </label>
            {/if}
        </div>

        <div class="preview-area">
            <div class="controls left">
                {#if bgMode === "presets"}
                    <ArrowButton
                        on:click={() => changeGradient(gradientCtx, "left")}
                        orientation="left"
                    />
                {/if}
            </div>

            <div class="canvas-wrapper">
                <div class="canvas-stack">
                    <canvas id="gradientCanvas" />
                    <canvas id="profileCanvas" />
                </div>
            </div>

            <div class="controls right">
                {#if bgMode === "presets"}
                    <ArrowButton
                        on:click={() => changeGradient(gradientCtx, "right")}
                        orientation="right"
                    />
                {/if}
            </div>
        </div>

        <div class="bg-controls">
            <div class="mode-toggle">
                <button
                    class:active={bgMode === "presets"}
                    on:click={() => setBgMode("presets")}
                >
                    Presets
                </button>
                <button
                    class:active={bgMode === "gradient"}
                    on:click={() => setBgMode("gradient")}
                >
                    Gradient
                </button>
                <button
                    class:active={bgMode === "upload"}
                    on:click={() => setBgMode("upload")}
                >
                    Image
                </button>
            </div>

            {#if bgMode === "gradient"}
                <div class="color-pickers">
                    <input type="color" bind:value={color1} on:input={updateBackground} />
                    <input type="color" bind:value={color2} on:input={updateBackground} />
                </div>
            {:else if bgMode === "upload"}
                <label class="file-upload small">
                    <span>Upload Image</span>
                    <input type="file" accept="image/*" on:change={handleBgUpload} />
                </label>
            {/if}
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

        @media (max-width: 600px) {
            padding: 2rem 1.5rem;
            border-radius: 16px;
            gap: 2rem;
        }
    }

    .card-title {
        font-size: 3.2rem;
        font-weight: 700;
        margin: 0;
        text-align: center;
        background: linear-gradient(
            135deg,
            var(--primary) 0%,
            var(--accent-color) 100%
        );
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;

        @media (max-width: 600px) {
            font-size: 2.4rem;
        }
    }

    /* ... omitted parts ... */
    
    .canvas-wrapper {
        position: relative;
        padding: 1rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 24px;
        border: 1px solid var(--glass-border);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        max-width: 100%;

        .canvas-stack {
            position: relative;
            width: 100%;
            max-width: 300px;
            aspect-ratio: 1;
            /* height: 300px;  Removed fixed height */

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

    .mode-toggle {
        display: flex;
        gap: 1rem;
        background: rgba(255, 255, 255, 0.05);
        padding: 0.5rem;
        border-radius: 12px;

        button {
            background: transparent;
            border: none;
            color: var(--text-muted);
            padding: 0.8rem 1.5rem;
            border-radius: 8px;
            font-family: var(--font-main);
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;

            &.active {
                background: rgba(255, 255, 255, 0.1);
                color: var(--primary);
            }

            &:hover:not(.active) {
                color: var(--text-main);
            }
        }
    }

    .input-group {
        position: relative;
        width: 100%;
        max-width: 300px;
        min-height: 60px;
        display: flex;
        justify-content: center;
        align-items: center;

        input[type="text"] {
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

        .file-upload {
            cursor: pointer;
            padding: 1rem 2rem;
            border: 2px dashed rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            color: var(--text-muted);
            transition: all 0.3s ease;
            width: 100%;
            text-align: center;

            &:hover {
                border-color: var(--primary);
                color: var(--primary);
                background: rgba(118, 74, 241, 0.05);
            }

            input {
                display: none;
            }
        }
    }

    .bg-controls {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        margin-top: 1rem;
        width: 100%;

        .color-pickers {
            display: flex;
            gap: 1rem;
            
            input[type="color"] {
                -webkit-appearance: none;
                border: none;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                cursor: pointer;
                background: none;
                padding: 0;
                overflow: hidden;
                
                &::-webkit-color-swatch-wrapper {
                    padding: 0; 
                }
                
                &::-webkit-color-swatch {
                    border: none;
                    border-radius: 50%;
                    border: 2px solid var(--glass-border);
                }
            }
        }
        
        .file-upload.small {
            padding: 0.5rem 1rem;
            min-height: auto;
            border-width: 1px;
            font-size: 1.4rem;
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
        max-width: 100%;

        .canvas-stack {
            position: relative;
            width: 100%;
            max-width: 300px;
            aspect-ratio: 1;
            display: block; /* Ensure it takes space */
            min-height: 200px; /* Fallback height to prevent 0px collapse */

            canvas {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border-radius: 16px;
                object-fit: contain; /* Ensure image fits */
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
