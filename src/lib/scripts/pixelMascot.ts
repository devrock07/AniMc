import { GIFEncoder, applyPalette, quantize } from "gifenc/dist/gifenc.esm.js";
import { loadImage } from "./utils";

type AnimationMode = "none" | "idle";

type MascotRenderOptions = {
    frame?: number;
    animation?: AnimationMode;
};

type FrameSpec = {
    bodyOffset: number;
    armOffset: number;
    legHeight: number;
    delay: number;
};

type SkinCanvas = {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    image: HTMLImageElement;
};

const MASCOT_GRID_SIZE = 20;
const SKIN_CACHE = new Map<string, Promise<HTMLImageElement>>();

function getAnimationFrames(animation: AnimationMode): FrameSpec[] {
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

async function getCachedSkinImage(src: string): Promise<HTMLImageElement> {
    if (!SKIN_CACHE.has(src)) {
        SKIN_CACHE.set(src, loadImage(src));
    }

    return SKIN_CACHE.get(src)!;
}

function createCanvas(width: number, height: number) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    return { canvas, ctx };
}

function getSkinCanvas(image: HTMLImageElement): SkinCanvas {
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
    sprite: HTMLCanvasElement,
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
        outlineCtx.drawImage(sprite, dx, dy);
    }

    outlineCtx.globalCompositeOperation = "source-atop";
    outlineCtx.fillStyle = outlineColor;
    outlineCtx.fillRect(0, 0, outlineCanvas.width, outlineCanvas.height);
    outlineCtx.globalCompositeOperation = "source-over";

    ctx.drawImage(outlineCanvas, 0, 0);
    ctx.drawImage(sprite, 0, 0);
}

function drawSpriteSlice(
    ctx: CanvasRenderingContext2D,
    sprite: HTMLCanvasElement,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number
) {
    ctx.drawImage(sprite, sx, sy, sw, sh, dx, dy, dw, dh);
}

function drawChibiLeg(
    ctx: CanvasRenderingContext2D,
    legSprite: HTMLCanvasElement,
    x: number,
    y: number,
    legHeight: number
) {
    const legCtx = legSprite.getContext("2d")!;
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
        skin.canvas,
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
            skin.canvas,
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
    const ctx = head.getContext("2d")!;
    const hasHat = hasOpaquePixels(skin.ctx, 40, 8, 8, 8);

    if (hasHat) {
        ctx.drawImage(skin.canvas, 40, 8, 8, 3, 0, 0, 8, 3);
        ctx.drawImage(skin.canvas, 40, 11, 2, 5, 0, 3, 2, 5);
        ctx.drawImage(skin.canvas, 46, 11, 2, 5, 6, 3, 2, 5);
    }

    return head;
}

function getArmRegions(image: HTMLImageElement) {
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

function getLegRegions(image: HTMLImageElement) {
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

async function buildMascotFrame(
    skin: string | null,
    options: MascotRenderOptions = {}
) {
    const { canvas: frameCanvas, ctx } = createCanvas(MASCOT_GRID_SIZE, MASCOT_GRID_SIZE);

    if (!skin) return frameCanvas;

    const image = await getCachedSkinImage(skin);
    const skinCanvas = getSkinCanvas(image);
    const frames = getAnimationFrames(options.animation ?? "idle");
    const frame = frames[
        (options.frame ?? 0) % frames.length
    ];

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
    const { canvas: spriteCanvas, ctx: spriteCtx } = createCanvas(MASCOT_GRID_SIZE, MASCOT_GRID_SIZE);

    drawSpriteSlice(
        spriteCtx,
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
        spriteCtx,
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
    drawChibiLeg(spriteCtx, parts.legLeft, legX, legY, legHeight);
    drawChibiLeg(spriteCtx, parts.legRight, legX + 2, legY, legHeight);
    drawSpriteSlice(
        spriteCtx,
        parts.torso,
        0,
        0,
        parts.torso.width,
        parts.torso.height,
        torsoX,
        torsoY,
        6,
        5
    );
    drawSpriteSlice(
        spriteCtx,
        parts.head,
        0,
        0,
        parts.head.width,
        parts.head.height,
        headX,
        headY,
        8,
        8
    );

    drawRect(ctx, "rgba(0, 0, 0, 0.18)", 5, 19, 10, 1);
    drawRect(ctx, "rgba(0, 0, 0, 0.1)", 6, 18, 8, 1);
    drawOutlinedSprite(ctx, spriteCanvas, outline);

    return frameCanvas;
}

async function renderPixelMascot(
    ctx: CanvasRenderingContext2D,
    skin: string | null,
    options: MascotRenderOptions = {}
) {
    const frame = await buildMascotFrame(skin, options);

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(frame, 0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
}

async function exportMascotGif(
    skin: string,
    backgroundCanvas: HTMLCanvasElement,
    animation: AnimationMode = "idle"
) {
    const frameCanvas = document.createElement("canvas");
    frameCanvas.width = backgroundCanvas.width;
    frameCanvas.height = backgroundCanvas.height;
    const frameCtx = frameCanvas.getContext("2d")!;
    frameCtx.imageSmoothingEnabled = false;

    const gif = GIFEncoder();
    const frames = getAnimationFrames(animation);

    for (let index = 0; index < frames.length; index++) {
        const overlay = await buildMascotFrame(skin, { frame: index, animation });

        frameCtx.clearRect(0, 0, frameCanvas.width, frameCanvas.height);
        frameCtx.drawImage(backgroundCanvas, 0, 0);
        frameCtx.drawImage(overlay, 0, 0, frameCanvas.width, frameCanvas.height);

        const imageData = frameCtx.getImageData(0, 0, frameCanvas.width, frameCanvas.height);
        const palette = quantize(imageData.data, 256, { format: "rgba4444", oneBitAlpha: true });
        const pixels = applyPalette(imageData.data, palette, "rgba4444");

        gif.writeFrame(pixels, frameCanvas.width, frameCanvas.height, {
            palette,
            delay: frames[index].delay,
            repeat: 0,
            transparent: true
        });
    }

    gif.finish();

    return new Blob([gif.bytesView()], { type: "image/gif" });
}

export {
    exportMascotGif,
    getAnimationFrames,
    renderPixelMascot
};
