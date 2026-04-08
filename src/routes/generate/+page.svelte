<script lang="ts">
    // @ts-ignore
    import { onDestroy, onMount } from "svelte";
    import SaveButton from "@components/SaveButton.svelte";
    import ArrowButton from "@components/ArrowButton.svelte";
    import Popup from "@components/Popup.svelte";
    import SEO from "@components/SEO.svelte";
    import { changeGradient, drawCustomGradient, drawCustomImage } from "@scripts/gradients";
    import generatePfp from "@scripts/generateProfile";
    import { exportMascotGif, getAnimationFrames, renderPixelMascot } from "@scripts/pixelMascot";
    import type {
        CapeStyle,
        FrameStyle,
        ItemStyle,
        OrnamentStyle
    } from "@scripts/pixelMascot";
    import { mergeCanvases, loadImage } from "@scripts/utils";
    import { page } from "$app/stores";
    import { goto } from "$app/navigation";

    const urlSearchParamIGN = $page.url.searchParams.get("ign") || null;
    const ornamentOptions: OrnamentStyle[] = ["none", "sparkles", "halo", "crown"];
    const frameOptions: FrameStyle[] = ["none", "pixel", "glass", "studio"];
    const capeOptions: CapeStyle[] = ["none", "classic", "royal"];
    const itemOptions: ItemStyle[] = ["none", "sword", "wand", "pickaxe"];

    let username = "";
    let firefoxPopup = false;
    let bgFileName = "";
    let renderStyle: "classic" | "mascot" = "classic";
    let animationMode: "none" | "idle" = "idle";
    let exportFormat: "png" | "gif" = "png";
    let previewFrame = 0;
    let previewTimer: ReturnType<typeof setInterval> | null = null;

    let gradientCanvas: HTMLCanvasElement;
    let gradientCtx: CanvasRenderingContext2D;
    let profileCanvas: HTMLCanvasElement;
    let profileCtx: CanvasRenderingContext2D;

    // Background State
    let bgMode: "presets" | "gradient" | "upload" | "none" = "presets";
    let color1 = "#00cdac";
    let color2 = "#02aab0";
    let customBgImage: HTMLImageElement | null = null;

    // Input Mode State
    let inputMode: "java" | "upload" = "java";
    let customSkinData: string | null = null;
    let showHat = true;
    let ornamentStyle: OrnamentStyle = "none";
    let frameStyle: FrameStyle = "none";
    let capeStyle: CapeStyle = "none";
    let heldItem: ItemStyle = "none";
    let mascotScale = 1;
    let mascotRotate = 0;
    let mascotOffsetX = 0;
    let mascotOffsetY = 0;
    let itemOffsetX = 0;
    let itemOffsetY = 0;
    let ornamentOffsetX = 0;
    let ornamentOffsetY = 0;


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

        await renderCurrentProfile();
    });

    onDestroy(() => {
        stopPreviewAnimation();
    });

    async function getActiveSkinSource() {
        if (inputMode === "upload") {
            return customSkinData;
        }

        return username ? `https://minotar.net/skin/${username}.png` : null;
    }

    function stopPreviewAnimation() {
        if (previewTimer) {
            clearInterval(previewTimer);
            previewTimer = null;
        }
    }

    async function drawCurrentFrame() {
        const skinSource = await getActiveSkinSource();

        try {
            if (renderStyle === "mascot") {
                await renderPixelMascot(profileCtx, skinSource, {
                    frame: previewFrame,
                    animation: animationMode,
                    showHat,
                    ornament: ornamentStyle,
                    frameStyle,
                    cape: capeStyle,
                    item: heldItem,
                    scale: mascotScale,
                    rotate: mascotRotate,
                    offsetX: mascotOffsetX,
                    offsetY: mascotOffsetY,
                    itemOffsetX,
                    itemOffsetY,
                    ornamentOffsetX,
                    ornamentOffsetY,
                    drawShadow: bgMode !== "none"
                });
                return;
            }

            await generatePfp(skinSource, profileCtx);
        } catch (error) {
            await generatePfp(null, profileCtx);
        }
    }

    async function syncPreviewAnimation() {
        stopPreviewAnimation();
        previewFrame = 0;
        await drawCurrentFrame();

        if (renderStyle !== "mascot" || animationMode === "none") {
            return;
        }

        const frames = getAnimationFrames(animationMode);
        previewTimer = setInterval(async () => {
            previewFrame = (previewFrame + 1) % frames.length;
            await drawCurrentFrame();
        }, 200);
    }

    async function renderCurrentProfile() {
        await syncPreviewAnimation();
    }

    async function savePicture() {
        if (renderStyle === "mascot" && exportFormat === "gif") {
            const skinSource = await getActiveSkinSource();
            if (!skinSource) return;

            const gifBlob = await exportMascotGif(
                skinSource,
                bgMode === "none" ? null : gradientCanvas,
                {
                    animation: animationMode,
                    showHat,
                    ornament: ornamentStyle,
                    frameStyle,
                    cape: capeStyle,
                    item: heldItem,
                    scale: mascotScale,
                    rotate: mascotRotate,
                    offsetX: mascotOffsetX,
                    offsetY: mascotOffsetY,
                    itemOffsetX,
                    itemOffsetY,
                    ornamentOffsetX,
                    ornamentOffsetY,
                    drawShadow: bgMode !== "none",
                    outputSize: profileCanvas.width
                }
            );
            const link = document.createElement("a");
            link.download = `AniMc - ${username || "unknown"}.gif`;
            link.href = URL.createObjectURL(gifBlob);
            link.click();
            setTimeout(() => URL.revokeObjectURL(link.href), 1000);
            return;
        }

        const merged = await buildExportCanvas();
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
            const merged = await buildExportCanvas();
            merged.toBlob(function (blob) {
                const item = new ClipboardItem({ "image/png": blob });
                navigator.clipboard.write([item]);
            });
        }
    }

    let timeout: ReturnType<typeof setTimeout> | null = null;
    async function validateInput() {
        username = username.replace(/[^a-z0-9_]/gi, "");

        try {
            await renderCurrentProfile();

            clearTimeout(timeout);
            timeout = setTimeout(async () => {
                await renderCurrentProfile();
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
            await renderCurrentProfile();
        };
        reader.readAsDataURL(file);
    }

    async function handleBgUpload(e: Event) {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;
        bgFileName = file.name;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const result = e.target?.result as string;
            customBgImage = await loadImage(result);
            updateBackground();
            await renderCurrentProfile();
        };
        reader.readAsDataURL(file);
    }

    function updateBackground() {
        if (!gradientCtx) return;

        if (bgMode === "presets") {
            changeGradient(gradientCtx);
        } else if (bgMode === "gradient") {
            drawCustomGradient(gradientCtx, [color1, color2]);
        } else if (bgMode === "upload" && customBgImage) {
            drawCustomImage(gradientCtx, customBgImage);
        } else {
            gradientCtx.clearRect(0, 0, 20, 20);
        }
    }

    async function toggleMode(mode: "java" | "upload") {
        inputMode = mode;
        if (mode === "java") {
            await validateInput();
        } else if (customSkinData) {
            await renderCurrentProfile();
        } else {
            await renderCurrentProfile();
        }
    }

    async function setBgMode(mode: "presets" | "gradient" | "upload" | "none") {
        bgMode = mode;
        updateBackground();
        await renderCurrentProfile();
    }

    async function setRenderStyle(style: "classic" | "mascot") {
        renderStyle = style;
        if (style === "classic") {
            exportFormat = "png";
        }
        await renderCurrentProfile();
    }

    async function setAnimationMode(mode: "none" | "idle") {
        animationMode = mode;
        if (mode === "none" && exportFormat === "gif" && renderStyle !== "mascot") {
            exportFormat = "png";
        }
        await renderCurrentProfile();
    }

    async function buildExportCanvas() {
        if (bgMode === "none") {
            const canvas = document.createElement("canvas");
            canvas.width = profileCanvas.width;
            canvas.height = profileCanvas.height;
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(profileCanvas, 0, 0);
            return canvas;
        }

        return mergeCanvases([gradientCanvas, profileCanvas]);
    }

    async function refreshMascotRender() {
        if (renderStyle !== "mascot") return;
        await renderCurrentProfile();
    }
</script>

<SEO 
    title="Generate Minecraft PFP - Free Custom Profile Picture Maker | AniMc"
    description="Create your custom Minecraft profile picture now! Upload your skin, choose gradients, and download your unique PFP for Discord, social media, and gaming profiles. 100% free, no watermark."
    username={urlSearchParamIGN || "makima"}
    url="https://animc.d4vrock.xyz/generate"
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

        <div class="style-panel">
            <div class="panel-heading">Render Style</div>
            <div class="mode-toggle compact">
                <button
                    class:active={renderStyle === "classic"}
                    on:click={() => setRenderStyle("classic")}
                >
                    Classic
                </button>
                <button
                    class:active={renderStyle === "mascot"}
                    on:click={() => setRenderStyle("mascot")}
                >
                    Pixel Mascot
                </button>
            </div>

            {#if renderStyle === "mascot"}
                <div class="style-subgrid">
                    <div class="stack">
                        <div class="panel-heading small">Animation</div>
                        <div class="mode-toggle compact">
                            <button
                                class:active={animationMode === "none"}
                                on:click={() => setAnimationMode("none")}
                            >
                                Static
                            </button>
                            <button
                                class:active={animationMode === "idle"}
                                on:click={() => setAnimationMode("idle")}
                            >
                                Idle
                            </button>
                        </div>
                    </div>

                    <div class="stack">
                        <div class="panel-heading small">Download</div>
                        <div class="mode-toggle compact">
                            <button
                                class:active={exportFormat === "png"}
                                on:click={() => (exportFormat = "png")}
                            >
                                PNG
                            </button>
                            <button
                                class:active={exportFormat === "gif"}
                                on:click={() => (exportFormat = "gif")}
                            >
                                GIF
                            </button>
                        </div>
                    </div>
                </div>
            {/if}
        </div>

        <div class="input-group">
            {#if inputMode === "java"}
                <input
                    type="text"
                    spellcheck="false"
                    maxlength="16"
                    pattern="[a-zA-Z0-9_]+"
                    bind:value={username}
                    on:input={() => validateInput()}
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
                    class:active={bgMode === "none"}
                    on:click={() => setBgMode("none")}
                >
                    No BG
                </button>
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
                    <input
                        type="color"
                        bind:value={color1}
                        on:input={() => {
                            updateBackground();
                            refreshMascotRender();
                        }}
                    />
                    <input
                        type="color"
                        bind:value={color2}
                        on:input={() => {
                            updateBackground();
                            refreshMascotRender();
                        }}
                    />
                </div>
            {:else if bgMode === "upload"}
                <label class="file-upload small">
                    <span>{bgFileName || "Upload Image"}</span>
                    <input type="file" accept="image/*" on:change={handleBgUpload} />
                </label>
            {/if}
        </div>

        {#if renderStyle === "mascot"}
            <div class="advanced-panel">
                <div class="panel-heading">Mascot Styling</div>

                <div class="advanced-grid">
                    <label class="field">
                        <span>Helmet Layer</span>
                        <div class="mode-toggle compact">
                            <button
                                class:active={showHat}
                                on:click={() => {
                                    showHat = true;
                                    refreshMascotRender();
                                }}
                            >
                                On
                            </button>
                            <button
                                class:active={!showHat}
                                on:click={() => {
                                    showHat = false;
                                    refreshMascotRender();
                                }}
                            >
                                Off
                            </button>
                        </div>
                    </label>

                    <label class="field">
                        <span>Frame</span>
                        <select bind:value={frameStyle} on:change={refreshMascotRender}>
                            {#each frameOptions as option}
                                <option value={option}>{option}</option>
                            {/each}
                        </select>
                    </label>

                    <label class="field">
                        <span>Ornament</span>
                        <select bind:value={ornamentStyle} on:change={refreshMascotRender}>
                            {#each ornamentOptions as option}
                                <option value={option}>{option}</option>
                            {/each}
                        </select>
                    </label>

                    <label class="field">
                        <span>Cape</span>
                        <select bind:value={capeStyle} on:change={refreshMascotRender}>
                            {#each capeOptions as option}
                                <option value={option}>{option}</option>
                            {/each}
                        </select>
                    </label>

                    <label class="field">
                        <span>Item</span>
                        <select bind:value={heldItem} on:change={refreshMascotRender}>
                            {#each itemOptions as option}
                                <option value={option}>{option}</option>
                            {/each}
                        </select>
                    </label>
                </div>

                <div class="panel-heading small">Pose Controls</div>
                <div class="slider-grid">
                    <label class="slider-field">
                        <div class="slider-meta">
                            <span>Scale</span>
                            <strong>{mascotScale.toFixed(2)}</strong>
                        </div>
                        <input
                            type="range"
                            min="0.75"
                            max="1.40"
                            step="0.05"
                            bind:value={mascotScale}
                            on:input={refreshMascotRender}
                        />
                    </label>

                    <label class="slider-field">
                        <div class="slider-meta">
                            <span>Rotate</span>
                            <strong>{mascotRotate} deg</strong>
                        </div>
                        <input
                            type="range"
                            min="-20"
                            max="20"
                            step="1"
                            bind:value={mascotRotate}
                            on:input={refreshMascotRender}
                        />
                    </label>

                    <label class="slider-field">
                        <div class="slider-meta">
                            <span>Item X</span>
                            <strong>{itemOffsetX}px</strong>
                        </div>
                        <input
                            type="range"
                            min="-5"
                            max="5"
                            step="1"
                            bind:value={itemOffsetX}
                            on:input={refreshMascotRender}
                        />
                    </label>

                    <label class="slider-field">
                        <div class="slider-meta">
                            <span>Item Y</span>
                            <strong>{itemOffsetY}px</strong>
                        </div>
                        <input
                            type="range"
                            min="-5"
                            max="5"
                            step="1"
                            bind:value={itemOffsetY}
                            on:input={refreshMascotRender}
                        />
                    </label>

                    <label class="slider-field">
                        <div class="slider-meta">
                            <span>Ornament X</span>
                            <strong>{ornamentOffsetX}px</strong>
                        </div>
                        <input
                            type="range"
                            min="-5"
                            max="5"
                            step="1"
                            bind:value={ornamentOffsetX}
                            on:input={refreshMascotRender}
                        />
                    </label>

                    <label class="slider-field">
                        <div class="slider-meta">
                            <span>Ornament Y</span>
                            <strong>{ornamentOffsetY}px</strong>
                        </div>
                        <input
                            type="range"
                            min="-5"
                            max="5"
                            step="1"
                            bind:value={ornamentOffsetY}
                            on:input={refreshMascotRender}
                        />
                    </label>

                    <label class="slider-field">
                        <div class="slider-meta">
                            <span>Position X</span>
                            <strong>{mascotOffsetX}px</strong>
                        </div>
                        <input
                            type="range"
                            min="-4"
                            max="4"
                            step="1"
                            bind:value={mascotOffsetX}
                            on:input={refreshMascotRender}
                        />
                    </label>

                    <label class="slider-field">
                        <div class="slider-meta">
                            <span>Position Y</span>
                            <strong>{mascotOffsetY}px</strong>
                        </div>
                        <input
                            type="range"
                            min="-4"
                            max="4"
                            step="1"
                            bind:value={mascotOffsetY}
                            on:input={refreshMascotRender}
                        />
                    </label>
                </div>
            </div>
        {/if}

        <div class="actions">
            <div
                class="btn-wrap"
                on:click={savePicture}
                on:keydown={savePicture}
                role="button"
                tabindex="0"
            >
                <SaveButton text={renderStyle === "mascot" && exportFormat === "gif" ? "Download GIF" : "Download"} />
            </div>
            <div
                class="btn-wrap"
                on:click={copyPicture}
                on:keydown={copyPicture}
                role="button"
                tabindex="0"
            >
                <SaveButton text={renderStyle === "mascot" && exportFormat === "gif" ? "Copy PNG" : "Copy"} />
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
        padding: 3rem 2rem 4rem;
    }

    .glass-card {
        background: linear-gradient(180deg, rgba(11, 23, 40, 0.86), rgba(9, 20, 36, 0.78));
        backdrop-filter: blur(18px);
        border: 1px solid var(--glass-border);
        border-radius: 28px;
        padding: 4rem;
        box-shadow: var(--shadow-soft);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2.4rem;
        width: 100%;
        max-width: 760px;
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
        letter-spacing: -0.04em;

        @media (max-width: 600px) {
            font-size: 2.4rem;
        }
    }

    .mode-toggle {
        display: flex;
        gap: 0.8rem;
        background: rgba(255, 255, 255, 0.05);
        padding: 0.5rem;
        border-radius: 16px;
        flex-wrap: wrap;
        justify-content: center;

        button {
            background: transparent;
            border: none;
            color: var(--text-muted);
            padding: 0.95rem 1.5rem;
            border-radius: 12px;
            font-family: var(--font-main);
            font-weight: 600;
            cursor: pointer;
            transition:
                background 0.3s ease,
                color 0.3s ease,
                transform 0.3s ease,
                box-shadow 0.3s ease;

            &.active {
                background: linear-gradient(135deg, rgba(255, 122, 24, 0.18), rgba(53, 208, 255, 0.16));
                color: var(--text-main);
                box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
            }

            &:hover:not(.active) {
                color: var(--text-main);
                background: rgba(255, 255, 255, 0.06);
                transform: translateY(-1px);
            }
        }
    }

    .style-panel {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        align-items: center;
        padding: 1.4rem;
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .style-subgrid {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;

        @media (max-width: 640px) {
            grid-template-columns: 1fr;
        }
    }

    .advanced-panel {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
        padding: 1.6rem;
        border-radius: 22px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .advanced-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;

        @media (max-width: 640px) {
            grid-template-columns: 1fr;
        }
    }

    .field,
    .slider-field {
        display: flex;
        flex-direction: column;
        gap: 0.7rem;

        span {
            font-size: 1.2rem;
            font-weight: 700;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: var(--text-muted);
        }
    }

    .field select {
        width: 100%;
        padding: 1rem 1.15rem;
        border-radius: 14px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(7, 17, 31, 0.9);
        color: var(--text-main);
        font-family: var(--font-main);
        font-size: 1.45rem;
        text-transform: capitalize;
        outline: none;
        transition:
            border-color 0.25s ease,
            background 0.25s ease,
            box-shadow 0.25s ease;

        &:focus {
            border-color: rgba(53, 208, 255, 0.38);
            box-shadow: 0 0 0 4px rgba(53, 208, 255, 0.08);
        }
    }

    .slider-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem 1.2rem;

        @media (max-width: 640px) {
            grid-template-columns: 1fr;
        }
    }

    .slider-field {
        padding: 1rem 1.1rem;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.05);

        input[type="range"] {
            width: 100%;
            accent-color: var(--accent-color);
        }
    }

    .slider-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;

        strong {
            font-size: 1.35rem;
            color: var(--text-main);
        }
    }

    .stack {
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
        width: 100%;
    }

    .panel-heading {
        font-size: 1.25rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--text-muted);
        text-align: center;

        &.small {
            font-size: 1.15rem;
        }
    }

    .mode-toggle.compact {
        width: 100%;

        button {
            flex: 1;
            min-width: 0;
            padding-inline: 1rem;
        }
    }

    .file-upload {
        cursor: pointer;
        padding: 1.25rem 2rem;
        border: 1px dashed rgba(255, 255, 255, 0.24);
        border-radius: 16px;
        color: var(--text-muted);
        transition:
            border-color 0.3s ease,
            color 0.3s ease,
            background 0.3s ease,
            transform 0.3s ease,
            box-shadow 0.3s ease;
        width: 100%;
        text-align: center;
        background: rgba(255, 255, 255, 0.04);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;

        &:hover {
            border-color: rgba(53, 208, 255, 0.4);
            color: var(--text-main);
            background: rgba(53, 208, 255, 0.06);
            transform: translateY(-1px);
            box-shadow: 0 14px 28px rgba(0, 0, 0, 0.16);
        }

        input {
            display: none;
        }
    }

    .input-group {
        position: relative;
        width: 100%;
        max-width: 300px;
        min-height: 6rem;
        display: flex;
        justify-content: center;
        align-items: center;

        input[type="text"] {
            width: 100%;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            padding: 1.2rem 1.4rem;
            font-size: 2rem;
            text-align: center;
            color: var(--text-main);
            font-family: var(--font-main);
            transition:
                border-color 0.3s ease,
                background 0.3s ease,
                box-shadow 0.3s ease;

            &:focus {
                outline: none;
                border-color: rgba(53, 208, 255, 0.4);
                background: rgba(255, 255, 255, 0.06);
                box-shadow: 0 0 0 5px rgba(53, 208, 255, 0.08);
            }

            &::placeholder {
                color: var(--text-muted);
                opacity: 0.5;
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
                width: 4.6rem;
                height: 4.6rem;
                border-radius: 50%;
                cursor: pointer;
                background: none;
                padding: 0;
                overflow: hidden;
                box-shadow: 0 10px 24px rgba(0, 0, 0, 0.24);
                
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
            min-width: min(100%, 26rem);
            padding: 1rem 1.4rem;
            min-height: auto;
            border-width: 1px;
            font-size: 1.4rem;
            border-style: solid;
            border-color: rgba(255, 255, 255, 0.1);
            background: linear-gradient(180deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.04));
            color: var(--text-main);
            box-shadow:
                inset 0 1px 0 rgba(255, 255, 255, 0.05),
                0 12px 24px rgba(0, 0, 0, 0.16);

            span {
                display: block;
                max-width: 100%;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
        }
    }

    .preview-area {
        display: flex;
        align-items: center;
        gap: 2rem;
        width: 100%;
        justify-content: center;

        @media (max-width: 600px) {
            flex-direction: column;
            gap: 1.2rem;
        }
    }

    .canvas-wrapper {
        position: relative;
        padding: 1.1rem;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.03));
        border-radius: 24px;
        border: 1px solid var(--glass-border);
        box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.06),
            0 18px 40px rgba(0, 0, 0, 0.26);
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
                object-fit: contain;
                image-rendering: pixelated;
                image-rendering: crisp-edges;
            }
        }
    }

    .actions {
        display: flex;
        gap: 1.2rem;
        margin-top: 1rem;
        flex-wrap: wrap;
        justify-content: center;
    }

    // Wrapper to catch clicks for the component
    .btn-wrap {
        cursor: pointer;
    }

    .controls {
        min-width: 6rem;
        display: flex;
        justify-content: center;

        @media (max-width: 600px) {
            min-width: 0;
        }
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
