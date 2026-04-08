import { Canvas } from "@napi-rs/canvas";
import { GIFEncoder, applyPalette, quantize } from "gifenc/dist/gifenc.esm.js";
import { loadImage } from "./image";
import { getSkin, valid } from "./mojang";

type RenderStyle = "classic" | "mascot";
type RenderFormat = "png" | "gif";
type AnimationMode = "none" | "idle";

type RenderRequestOptions = {
    username: string;
    origin: string;
    format: RenderFormat;
    style: RenderStyle;
    animation: AnimationMode;
    size: number;
    colors: string[];
};

type ClassicFrameSpec = {
    bodyOffset: number;
    delay: number;
};

type MascotFrameSpec = {
    bodyOffset: number;
    armOffset: number;
    legHeight: number;
    delay: number;
};

type SkinCanvas = {
    canvas: Canvas;
    ctx: CanvasRenderingContext2D;
    image: any;
};

class PublicRenderError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

const GRID_SIZE = 20;
const DEFAULT_SIZE = 300;
const DEFAULT_COLORS = ["#00cdac", "#02aab0"];
const MIN_SIZE = 64;
const MAX_SIZE = 1024;

function createCanvas(width: number, height: number) {
    const canvas = new Canvas(width, height);
    const ctx = canvas.getContext("2d") as unknown as CanvasRenderingContext2D;
    ctx.imageSmoothingEnabled = false;
    return { canvas, ctx };
}

function parseGradientParam(value: string | null) {
    if (!value) return DEFAULT_COLORS;

    const colours = value
        .split("-")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => (part.startsWith("#") ? part : `#${part}`));

    if (colours.length < 2) {
        throw new PublicRenderError(400, "gradient must contain at least two colours");
    }

    const validHex = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
    if (colours.some((colour) => !validHex.test(colour))) {
        throw new PublicRenderError(400, "gradient contains an invalid hex colour");
    }

    return colours;
}

function parseSizeParam(value: string | null) {
    if (!value) return DEFAULT_SIZE;

    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
        throw new PublicRenderError(400, "size must be a number");
    }

    return Math.min(MAX_SIZE, Math.max(MIN_SIZE, parsed));
}

function parseStyleParam(value: string | null): RenderStyle {
    if (!value) return "classic";

    if (value === "classic" || value === "normal") return "classic";
    if (value === "mascot") return "mascot";

    throw new PublicRenderError(400, "style must be classic or mascot");
}

function parseAnimationParam(
    value: string | null,
    format: RenderFormat
): AnimationMode {
    if (!value) {
        return format === "gif" ? "idle" : "none";
    }

    if (value === "none" || value === "idle") return value;

    throw new PublicRenderError(400, "animation must be none or idle");
}

function parseFormat(format: string): RenderFormat {
    if (format === "png" || format === "gif") return format;
    throw new PublicRenderError(400, "format must be png or gif");
}

function normalizeRenderOptions(params: {
    username: string | undefined;
    format: string;
    origin: string;
    searchParams: URLSearchParams;
}): RenderRequestOptions {
    const username = params.username?.trim();
    if (!username) {
        throw new PublicRenderError(400, "Missing username");
    }

    if (!valid(username)) {
        throw new PublicRenderError(400, "Username must be 1-16 characters and use only letters, numbers, or underscores");
    }

    const format = parseFormat(params.format);
    const style = parseStyleParam(params.searchParams.get("style"));
    const animation = parseAnimationParam(params.searchParams.get("animation"), format);
    const size = parseSizeParam(params.searchParams.get("size"));
    const colors = parseGradientParam(params.searchParams.get("gradient"));

    return {
        username,
        origin: params.origin,
        format,
        style,
        animation,
        size,
        colors
    };
}

function drawGradient(ctx: CanvasRenderingContext2D, colours: string[]) {
    const gradient = ctx.createLinearGradient(0, GRID_SIZE, 0, 0);
    let interval = 1;
    const decrement = 1 / (colours.length - 1);

    colours.forEach((colour) => {
        gradient.addColorStop(interval, colour);
        interval -= decrement;
    });

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GRID_SIZE, GRID_SIZE);
}

function buildBackgroundCanvas(colours: string[]) {
    const { canvas, ctx } = createCanvas(GRID_SIZE, GRID_SIZE);
    drawGradient(ctx, colours);
    return canvas;
}

function buildOutputCanvas(
    background: Canvas,
    sprite: Canvas,
    size: number
) {
    const { canvas, ctx } = createCanvas(size, size);
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(background as any, 0, 0, size, size);
    ctx.drawImage(sprite as any, 0, 0, size, size);
    return canvas;
}

async function loadClassicAssets(origin: string) {
    const backdrop = await loadImage(new URL("/backdropshading.png", origin).toString());
    const shading = await loadImage(new URL("/20x20pshading.png", origin).toString());

    return { backdrop, shading };
}

async function getSkinImage(username: string) {
    try {
        const skinURL = await getSkin(username);
        return await loadImage(skinURL);
    } catch (error) {
        throw new PublicRenderError(404, `Could not load skin for ${username}`);
    }
}

function drawClassicBody(
    ctx: CanvasRenderingContext2D,
    skinImage: any,
    bodyOffset = 0
) {
    if (skinImage.height === 32) {
        ctx.drawImage(skinImage, 8, 9, 7, 7, 8, 4 + bodyOffset, 7, 7);
        ctx.drawImage(skinImage, 5, 9, 3, 7, 5, 4 + bodyOffset, 3, 7);
        ctx.drawImage(skinImage, 44, 20, 3, 7, 12, 13 + bodyOffset, 3, 7);
        ctx.drawImage(skinImage, 21, 20, 6, 1, 7, 11 + bodyOffset, 6, 1);
        ctx.drawImage(skinImage, 20, 21, 8, 8, 6, 12 + bodyOffset, 8, 8);
        ctx.drawImage(skinImage, 44, 20, 3, 7, 5, 13 + bodyOffset, 3, 7);
        ctx.drawImage(skinImage, 40, 9, 7, 7, 8, 4 + bodyOffset, 7, 7);
        ctx.drawImage(skinImage, 33, 9, 3, 7, 5, 4 + bodyOffset, 3, 7);
        return;
    }

    ctx.drawImage(skinImage, 8, 9, 7, 7, 8, 4 + bodyOffset, 7, 7);
    ctx.drawImage(skinImage, 5, 9, 3, 7, 5, 4 + bodyOffset, 3, 7);
    ctx.drawImage(skinImage, 36, 52, 3, 7, 12, 13 + bodyOffset, 3, 7);
    ctx.drawImage(skinImage, 21, 20, 6, 1, 7, 11 + bodyOffset, 6, 1);
    ctx.drawImage(skinImage, 20, 21, 8, 8, 6, 12 + bodyOffset, 8, 8);
    ctx.drawImage(skinImage, 44, 20, 3, 7, 5, 13 + bodyOffset, 3, 7);
    ctx.drawImage(skinImage, 40, 9, 7, 7, 8, 4 + bodyOffset, 7, 7);
    ctx.drawImage(skinImage, 33, 9, 3, 7, 5, 4 + bodyOffset, 3, 7);
    ctx.drawImage(skinImage, 52, 52, 3, 7, 12, 13 + bodyOffset, 3, 7);
    ctx.drawImage(skinImage, 52, 36, 3, 7, 5, 13 + bodyOffset, 3, 7);
    ctx.drawImage(skinImage, 20, 37, 8, 8, 6, 12 + bodyOffset, 8, 8);
    ctx.drawImage(skinImage, 21, 36, 6, 1, 7, 11 + bodyOffset, 6, 1);
}

function getClassicAnimationFrames(animation: AnimationMode): ClassicFrameSpec[] {
    if (animation === "none") {
        return [{ bodyOffset: 0, delay: 1000 }];
    }

    return [
        { bodyOffset: 0, delay: 180 },
        { bodyOffset: 0, delay: 180 },
        { bodyOffset: 1, delay: 150 },
        { bodyOffset: 1, delay: 150 },
        { bodyOffset: 0, delay: 180 },
        { bodyOffset: 0, delay: 180 }
    ];
}

function renderClassicSprite(
    skinImage: any,
    assets: { backdrop: any; shading: any },
    frame: ClassicFrameSpec
) {
    const { canvas, ctx } = createCanvas(GRID_SIZE, GRID_SIZE);
    ctx.clearRect(0, 0, GRID_SIZE, GRID_SIZE);
    ctx.drawImage(assets.backdrop, 0, 0, GRID_SIZE, GRID_SIZE);
    drawClassicBody(ctx, skinImage, frame.bodyOffset);
    ctx.drawImage(assets.shading, 0, 0, GRID_SIZE, GRID_SIZE);
    return canvas;
}

function getAnimationFrames(animation: AnimationMode): MascotFrameSpec[] {
    if (animation === "none") {
        return [{ bodyOffset: 0, armOffset: 0, legHeight: 4, delay: 1000 }];
    }

    return [
        { bodyOffset: 0, armOffset: 0, legHeight: 4, delay: 180 },
        { bodyOffset: 0, armOffset: 0, legHeight: 4, delay: 180 },
        { bodyOffset: 1, armOffset: 0, legHeight: 3, delay: 160 },
        { bodyOffset: 1, armOffset: 0, legHeight: 3, delay: 160 },
        { bodyOffset: 0, armOffset: 0, legHeight: 4, delay: 180 },
        { bodyOffset: 0, armOffset: 0, legHeight: 4, delay: 180 }
    ];
}

function getSkinCanvas(image: any): SkinCanvas {
    const { canvas, ctx } = createCanvas(image.width, image.height);
    ctx.drawImage(image, 0, 0);
    return { canvas, ctx, image };
}

function hasOpaquePixels(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
) {
    const data = ctx.getImageData(x, y, width, height).data;

    for (let index = 3; index < data.length; index += 4) {
        if (data[index] > 10) return true;
    }

    return false;
}

function averageRegion(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
): [number, number, number] {
    const data = ctx.getImageData(x, y, width, height).data;
    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;

    for (let index = 0; index < data.length; index += 4) {
        if (data[index + 3] < 10) continue;
        r += data[index];
        g += data[index + 1];
        b += data[index + 2];
        count++;
    }

    if (!count) return [20, 20, 20];

    return [Math.round(r / count), Math.round(g / count), Math.round(b / count)];
}

function rgb(color: [number, number, number]) {
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

function shift(color: [number, number, number], amount: number): [number, number, number] {
    const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)));
    return [
        clamp(color[0] + amount),
        clamp(color[1] + amount),
        clamp(color[2] + amount)
    ];
}

function drawRect(
    ctx: CanvasRenderingContext2D,
    color: string,
    x: number,
    y: number,
    width: number,
    height: number
) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
}

function drawOutlinedSprite(
    ctx: CanvasRenderingContext2D,
    sprite: Canvas,
    outlineColor: string
) {
    const { canvas: outlineCanvas, ctx: outlineCtx } = createCanvas(
        sprite.width,
        sprite.height
    );

    const offsets = [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1]
    ];

    for (const [dx, dy] of offsets) {
        outlineCtx.drawImage(sprite as any, dx, dy);
    }

    outlineCtx.globalCompositeOperation = "source-atop";
    outlineCtx.fillStyle = outlineColor;
    outlineCtx.fillRect(0, 0, outlineCanvas.width, outlineCanvas.height);
    outlineCtx.globalCompositeOperation = "source-over";

    ctx.drawImage(outlineCanvas as any, 0, 0);
    ctx.drawImage(sprite as any, 0, 0);
}

function drawSpriteSlice(
    ctx: CanvasRenderingContext2D,
    sprite: Canvas,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number
) {
    ctx.drawImage(sprite as any, sx, sy, sw, sh, dx, dy, dw, dh);
}

function drawChibiLeg(
    ctx: CanvasRenderingContext2D,
    legSprite: Canvas,
    x: number,
    y: number,
    legHeight: number
) {
    const legCtx = legSprite.getContext("2d") as unknown as CanvasRenderingContext2D;
    const shinHeight = Math.max(2, legHeight - 1);
    const footColor = rgb(shift(averageRegion(legCtx, 0, 8, 4, 4), -10));
    const soleColor = rgb(shift(averageRegion(legCtx, 0, 8, 4, 4), -38));

    drawSpriteSlice(
        ctx,
        legSprite,
        0,
        0,
        legSprite.width,
        8,
        x,
        y,
        2,
        shinHeight
    );

    drawRect(ctx, footColor, x, y + shinHeight, 2, 1);
    drawRect(ctx, soleColor, x, y + shinHeight + 1, 2, 1);
}

function composeRegion(
    skin: SkinCanvas,
    base: [number, number, number, number],
    overlay?: [number, number, number, number]
) {
    const { canvas, ctx } = createCanvas(base[2], base[3]);
    ctx.drawImage(
        skin.canvas as any,
        base[0],
        base[1],
        base[2],
        base[3],
        0,
        0,
        base[2],
        base[3]
    );

    if (overlay && hasOpaquePixels(skin.ctx, overlay[0], overlay[1], overlay[2], overlay[3])) {
        ctx.drawImage(
            skin.canvas as any,
            overlay[0],
            overlay[1],
            overlay[2],
            overlay[3],
            0,
            0,
            overlay[2],
            overlay[3]
        );
    }

    return canvas;
}

function buildHeadCanvas(skin: SkinCanvas) {
    const head = composeRegion(skin, [8, 8, 8, 8]);
    const ctx = head.getContext("2d") as unknown as CanvasRenderingContext2D;
    const hasHat = hasOpaquePixels(skin.ctx, 40, 8, 8, 8);

    if (hasHat) {
        ctx.drawImage(skin.canvas as any, 40, 8, 8, 3, 0, 0, 8, 3);
        ctx.drawImage(skin.canvas as any, 40, 11, 2, 5, 0, 3, 2, 5);
        ctx.drawImage(skin.canvas as any, 46, 11, 2, 5, 6, 3, 2, 5);
    }

    return head;
}

function getArmRegions(image: any) {
    if (image.height === 32) {
        return {
            rightBase: [44, 20, 4, 12] as [number, number, number, number],
            rightOverlay: undefined,
            leftBase: [44, 20, 4, 12] as [number, number, number, number],
            leftOverlay: undefined
        };
    }

    return {
        rightBase: [44, 20, 4, 12] as [number, number, number, number],
        rightOverlay: [44, 36, 4, 12] as [number, number, number, number],
        leftBase: [36, 52, 4, 12] as [number, number, number, number],
        leftOverlay: [52, 52, 4, 12] as [number, number, number, number]
    };
}

function getLegRegions(image: any) {
    if (image.height === 32) {
        return {
            rightBase: [4, 20, 4, 12] as [number, number, number, number],
            rightOverlay: undefined,
            leftBase: [4, 20, 4, 12] as [number, number, number, number],
            leftOverlay: undefined
        };
    }

    return {
        rightBase: [4, 20, 4, 12] as [number, number, number, number],
        rightOverlay: [4, 36, 4, 12] as [number, number, number, number],
        leftBase: [20, 52, 4, 12] as [number, number, number, number],
        leftOverlay: [4, 52, 4, 12] as [number, number, number, number]
    };
}

function buildCharacterParts(skin: SkinCanvas) {
    const arms = getArmRegions(skin.image);
    const legs = getLegRegions(skin.image);

    return {
        head: buildHeadCanvas(skin),
        torso: composeRegion(skin, [20, 20, 8, 12], [20, 36, 8, 12]),
        armLeft: composeRegion(skin, arms.leftBase, arms.leftOverlay),
        armRight: composeRegion(skin, arms.rightBase, arms.rightOverlay),
        legLeft: composeRegion(skin, legs.leftBase, legs.leftOverlay),
        legRight: composeRegion(skin, legs.rightBase, legs.rightOverlay)
    };
}

function renderMascotSprite(skinImage: any, frame: MascotFrameSpec) {
    const skinCanvas = getSkinCanvas(skinImage);
    const hair = averageRegion(skinCanvas.ctx, 40, 8, 8, 8);
    const parts = buildCharacterParts(skinCanvas);
    const bodyOffset = frame.bodyOffset;
    const headX = 6;
    const headY = 2 + bodyOffset;
    const torsoX = 7;
    const torsoY = 10 + bodyOffset;
    const armY = 11 + bodyOffset + frame.armOffset;
    const legY = 15 + bodyOffset;
    const legHeight = frame.legHeight;
    const legX = torsoX + 1;
    const outline = rgb(shift(hair, -58));
    const { canvas: spriteCanvas, ctx: spriteCtx } = createCanvas(GRID_SIZE, GRID_SIZE);
    const ctx = spriteCtx as CanvasRenderingContext2D;

    drawSpriteSlice(
        ctx,
        parts.armLeft,
        0,
        1,
        parts.armLeft.width,
        parts.armLeft.height - 1,
        torsoX - 2,
        armY,
        2,
        5
    );
    drawSpriteSlice(
        ctx,
        parts.armRight,
        0,
        1,
        parts.armRight.width,
        parts.armRight.height - 1,
        torsoX + 6,
        armY,
        2,
        5
    );
    drawChibiLeg(ctx, parts.legLeft, legX, legY, legHeight);
    drawChibiLeg(ctx, parts.legRight, legX + 2, legY, legHeight);
    ctx.drawImage(parts.torso as any, torsoX, torsoY, 6, 5);
    ctx.drawImage(parts.head as any, headX, headY, 8, 8);

    drawRect(ctx, "rgba(0, 0, 0, 0.18)", 5, 19, 10, 1);
    drawRect(ctx, "rgba(0, 0, 0, 0.1)", 6, 18, 8, 1);

    const { canvas, ctx: finalCtx } = createCanvas(GRID_SIZE, GRID_SIZE);
    drawOutlinedSprite(finalCtx, spriteCanvas, outline);
    return canvas;
}

function buildCorsHeaders(contentType?: string) {
    const headers: Record<string, string> = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "public, max-age=0, s-maxage=3600"
    };

    if (contentType) {
        headers["Content-Type"] = contentType;
    }

    return headers;
}

async function renderPng(options: RenderRequestOptions) {
    const skinImage = await getSkinImage(options.username);
    const background = buildBackgroundCanvas(options.colors);
    const sprite =
        options.style === "mascot"
            ? renderMascotSprite(skinImage, getAnimationFrames("none")[0])
            : renderClassicSprite(skinImage, await loadClassicAssets(options.origin), getClassicAnimationFrames("none")[0]);

    const output = buildOutputCanvas(background, sprite, options.size);
    return output.toBuffer("image/png");
}

async function renderGif(options: RenderRequestOptions) {
    const skinImage = await getSkinImage(options.username);
    const background = buildBackgroundCanvas(options.colors);
    const gif = GIFEncoder();
    const frameCanvas = buildOutputCanvas(background, createCanvas(GRID_SIZE, GRID_SIZE).canvas, options.size);
    const frameCtx = frameCanvas.getContext("2d") as unknown as CanvasRenderingContext2D;
    const classicAssets = options.style === "classic" ? await loadClassicAssets(options.origin) : null;
    const frames =
        options.style === "mascot"
            ? getAnimationFrames(options.animation)
            : getClassicAnimationFrames(options.animation);

    for (const frame of frames) {
        const sprite =
            options.style === "mascot"
                ? renderMascotSprite(skinImage, frame as MascotFrameSpec)
                : renderClassicSprite(skinImage, classicAssets!, frame as ClassicFrameSpec);

        frameCtx.clearRect(0, 0, options.size, options.size);
        frameCtx.drawImage(background as any, 0, 0, options.size, options.size);
        frameCtx.drawImage(sprite as any, 0, 0, options.size, options.size);

        const imageData = frameCtx.getImageData(0, 0, options.size, options.size);
        const palette = quantize(imageData.data, 256, {
            format: "rgba4444",
            oneBitAlpha: true
        });
        const pixels = applyPalette(imageData.data, palette, "rgba4444");

        gif.writeFrame(pixels, options.size, options.size, {
            palette,
            delay: frame.delay,
            repeat: 0,
            transparent: true
        });
    }

    gif.finish();
    return Buffer.from(gif.bytesView());
}

async function renderPublicImage(options: RenderRequestOptions) {
    if (options.format === "png") {
        return {
            body: await renderPng(options),
            contentType: "image/png"
        };
    }

    return {
        body: await renderGif(options),
        contentType: "image/gif"
    };
}

export {
    PublicRenderError,
    buildCorsHeaders,
    normalizeRenderOptions,
    renderPublicImage
};
export type {
    AnimationMode,
    RenderFormat,
    RenderRequestOptions,
    RenderStyle
};
