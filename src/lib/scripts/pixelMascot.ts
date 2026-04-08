import { GIFEncoder, applyPalette, quantize } from "gifenc/dist/gifenc.esm.js";
import { loadImage } from "./utils";

type AnimationMode = "none" | "idle";
type OrnamentStyle = "none" | "sparkles" | "halo" | "crown";
type FrameStyle = "none" | "pixel" | "glass" | "studio";
type CapeStyle = "none" | "classic" | "royal";
type ItemStyle = "none" | "sword" | "wand" | "pickaxe";

type MascotRenderOptions = {
    frame?: number;
    animation?: AnimationMode;
    showHat?: boolean;
    ornament?: OrnamentStyle;
    frameStyle?: FrameStyle;
    cape?: CapeStyle;
    item?: ItemStyle;
    scale?: number;
    rotate?: number;
    offsetX?: number;
    offsetY?: number;
    itemOffsetX?: number;
    itemOffsetY?: number;
    ornamentOffsetX?: number;
    ornamentOffsetY?: number;
    drawShadow?: boolean;
    outputSize?: number;
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

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function toRadians(degrees: number) {
    return (degrees * Math.PI) / 180;
}

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
    return [
        clamp(Math.round(color[0] + amount), 0, 255),
        clamp(Math.round(color[1] + amount), 0, 255),
        clamp(Math.round(color[2] + amount), 0, 255)
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

function getCapePalette(cape: Exclude<CapeStyle, "none">) {
    if (cape === "royal") {
        return {
            outer: "#31104f",
            main: "#7d34d7",
            light: "#d8b4ff",
            trim: "#ffcc66"
        };
    }

    return {
        outer: "#4a0f1f",
        main: "#cc224f",
        light: "#ff8ba7",
        trim: "#f4d06f"
    };
}

function drawCapeBlock(
    ctx: CanvasRenderingContext2D,
    cape: CapeStyle,
    x: number,
    y: number,
    width: number,
    height: number
) {
    if (cape === "none") return;

    const palette = getCapePalette(cape);
    drawRect(ctx, palette.outer, x, y, width, height);
    drawRect(ctx, palette.main, x + 1, y, width - 2, height - 1);
    drawRect(ctx, palette.light, x + 1, y + 1, 1, height - 3);
    drawRect(ctx, palette.trim, x + 1, y + height - 1, width - 2, 1);
}

function drawHeldItem(
    ctx: CanvasRenderingContext2D,
    item: ItemStyle,
    x: number,
    y: number
) {
    if (item === "none") return;

    if (item === "sword") {
        drawRect(ctx, "#dff9ff", x + 2, y, 1, 1);
        drawRect(ctx, "#6ce0ff", x + 1, y + 1, 2, 1);
        drawRect(ctx, "#41b8ff", x + 2, y + 2, 1, 2);
        drawRect(ctx, "#0f6fcf", x + 1, y + 3, 1, 1);
        drawRect(ctx, "#f2c14e", x + 1, y + 4, 3, 1);
        drawRect(ctx, "#7d5326", x + 2, y + 5, 1, 2);
        drawRect(ctx, "#563417", x + 2, y + 7, 1, 1);
        return;
    }

    if (item === "wand") {
        drawRect(ctx, "#dff9ff", x + 1, y, 1, 1);
        drawRect(ctx, "#43d7ff", x, y + 1, 3, 1);
        drawRect(ctx, "#8bf0ff", x + 1, y + 2, 1, 1);
        drawRect(ctx, "#7d5326", x + 1, y + 3, 1, 4);
        drawRect(ctx, "#563417", x + 1, y + 7, 1, 1);
        return;
    }

    drawRect(ctx, "#76ebff", x, y, 4, 1);
    drawRect(ctx, "#43b7ff", x + 2, y + 1, 3, 1);
    drawRect(ctx, "#1d89e2", x + 3, y + 2, 1, 1);
    drawRect(ctx, "#1d89e2", x + 1, y + 2, 1, 1);
    drawRect(ctx, "#7d5326", x + 2, y + 2, 1, 5);
    drawRect(ctx, "#563417", x + 2, y + 7, 1, 1);
}

function drawPixelSparkle(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
    drawRect(ctx, color, x + 1, y, 1, 3);
    drawRect(ctx, color, x, y + 1, 3, 1);
}

function drawOrnamentLayer(ctx: CanvasRenderingContext2D, options: MascotRenderOptions) {
    const ornament = options.ornament ?? "none";
    const ornamentX = (options.offsetX ?? 0) + (options.ornamentOffsetX ?? 0);
    const ornamentY = (options.offsetY ?? 0) + (options.ornamentOffsetY ?? 0);
    const centerX = 10 + ornamentX;
    const topY = clamp(2 + ornamentY, 1, 8);

    if (ornament === "sparkles") {
        drawPixelSparkle(ctx, 2 + ornamentX, 4 + ornamentY, "#f7fbff");
        drawPixelSparkle(ctx, 15 + ornamentX, 3 + ornamentY, "#e0fdff");
        drawPixelSparkle(ctx, 14 + ornamentX, 13 + ornamentY, "#d4fdff");
        return;
    }

    if (ornament === "halo") {
        drawRect(ctx, "#f4b942", centerX - 3, topY, 7, 1);
        drawRect(ctx, "#ffe39a", centerX - 2, topY - 1, 5, 1);
        drawRect(ctx, "#8f5b0a", centerX - 4, topY, 1, 1);
        drawRect(ctx, "#8f5b0a", centerX + 3, topY, 1, 1);
        return;
    }

    if (ornament === "crown") {
        drawRect(ctx, "#c07a18", centerX - 3, topY + 1, 7, 1);
        drawRect(ctx, "#ffd05a", centerX - 2, topY, 1, 1);
        drawRect(ctx, "#ffd05a", centerX, topY - 1, 1, 2);
        drawRect(ctx, "#ffd05a", centerX + 2, topY, 1, 1);
        drawRect(ctx, "#ff5d7a", centerX, topY, 1, 1);
    }
}

function drawFrameLayer(ctx: CanvasRenderingContext2D, frameStyle: FrameStyle) {
    if (frameStyle === "none") return;

    if (frameStyle === "pixel") {
        drawRect(ctx, "rgba(0, 0, 0, 0.46)", 0, 0, MASCOT_GRID_SIZE, 1);
        drawRect(ctx, "rgba(0, 0, 0, 0.46)", 0, MASCOT_GRID_SIZE - 1, MASCOT_GRID_SIZE, 1);
        drawRect(ctx, "rgba(0, 0, 0, 0.46)", 0, 0, 1, MASCOT_GRID_SIZE);
        drawRect(ctx, "rgba(0, 0, 0, 0.46)", MASCOT_GRID_SIZE - 1, 0, 1, MASCOT_GRID_SIZE);
        drawRect(ctx, "rgba(255, 255, 255, 0.24)", 1, 1, MASCOT_GRID_SIZE - 2, 1);
        drawRect(ctx, "rgba(255, 255, 255, 0.12)", 1, 1, 1, MASCOT_GRID_SIZE - 2);
        return;
    }

    if (frameStyle === "glass") {
        drawRect(ctx, "rgba(6, 14, 24, 0.58)", 0, 0, MASCOT_GRID_SIZE, 2);
        drawRect(ctx, "rgba(6, 14, 24, 0.58)", 0, MASCOT_GRID_SIZE - 2, MASCOT_GRID_SIZE, 2);
        drawRect(ctx, "rgba(6, 14, 24, 0.58)", 0, 0, 2, MASCOT_GRID_SIZE);
        drawRect(ctx, "rgba(6, 14, 24, 0.58)", MASCOT_GRID_SIZE - 2, 0, 2, MASCOT_GRID_SIZE);
        drawRect(ctx, "rgba(180, 236, 255, 0.32)", 1, 1, MASCOT_GRID_SIZE - 2, 1);
        drawRect(ctx, "rgba(180, 236, 255, 0.18)", 1, 2, MASCOT_GRID_SIZE - 2, 1);
        return;
    }

    drawRect(ctx, "rgba(69, 34, 16, 0.76)", 0, 0, MASCOT_GRID_SIZE, 2);
    drawRect(ctx, "rgba(69, 34, 16, 0.76)", 0, MASCOT_GRID_SIZE - 2, MASCOT_GRID_SIZE, 2);
    drawRect(ctx, "rgba(69, 34, 16, 0.76)", 0, 0, 2, MASCOT_GRID_SIZE);
    drawRect(ctx, "rgba(69, 34, 16, 0.76)", MASCOT_GRID_SIZE - 2, 0, 2, MASCOT_GRID_SIZE);
    drawRect(ctx, "rgba(255, 208, 90, 0.36)", 2, 2, MASCOT_GRID_SIZE - 4, 1);
    drawRect(ctx, "rgba(255, 208, 90, 0.18)", 2, MASCOT_GRID_SIZE - 3, MASCOT_GRID_SIZE - 4, 1);
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

function buildHeadCanvas(skin: SkinCanvas, showHat = true) {
    const head = composeRegion(skin, [8, 8, 8, 8]);
    const ctx = head.getContext("2d")!;
    const hasHat = showHat && hasOpaquePixels(skin.ctx, 40, 8, 8, 8);

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

function buildCharacterParts(skin: SkinCanvas, showHat = true) {
    const arms = getArmRegions(skin.image);
    const legs = getLegRegions(skin.image);

    return {
        head: buildHeadCanvas(skin, showHat),
        torso: composeRegion(skin, [20, 20, 8, 12], [20, 36, 8, 12]),
        armLeft: composeRegion(skin, arms.leftBase, arms.leftOverlay),
        armRight: composeRegion(skin, arms.rightBase, arms.rightOverlay),
        legLeft: composeRegion(skin, legs.leftBase, legs.leftOverlay),
        legRight: composeRegion(skin, legs.rightBase, legs.rightOverlay)
    };
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

function getItemAnchor(item: ItemStyle, torsoX: number, armY: number) {
    if (item === "pickaxe") {
        return { x: torsoX + 4, y: armY - 1 };
    }

    if (item === "wand") {
        return { x: torsoX + 6, y: armY };
    }

    return { x: torsoX + 5, y: armY - 1 };
}

function composeScene(
    sprite: HTMLCanvasElement,
    options: MascotRenderOptions
) {
    const { canvas, ctx } = createCanvas(MASCOT_GRID_SIZE, MASCOT_GRID_SIZE);
    const offsetX = options.offsetX ?? 0;
    const offsetY = options.offsetY ?? 0;

    if (options.drawShadow ?? true) {
        drawRect(ctx, "rgba(0, 0, 0, 0.18)", 5 + offsetX, 19 + offsetY, 10, 1);
        drawRect(ctx, "rgba(0, 0, 0, 0.1)", 6 + offsetX, 18 + offsetY, 8, 1);
    }

    ctx.save();
    ctx.translate(MASCOT_GRID_SIZE / 2 + offsetX, MASCOT_GRID_SIZE / 2 + offsetY);
    ctx.rotate(toRadians(options.rotate ?? 0));
    const scale = options.scale ?? 1;
    ctx.scale(scale, scale);
    ctx.drawImage(sprite, -MASCOT_GRID_SIZE / 2, -MASCOT_GRID_SIZE / 2, MASCOT_GRID_SIZE, MASCOT_GRID_SIZE);
    ctx.restore();

    drawOrnamentLayer(ctx, options);
    drawFrameLayer(ctx, options.frameStyle ?? "none");

    return canvas;
}

async function buildMascotFrame(
    skin: string | null,
    options: MascotRenderOptions = {}
) {
    if (!skin) {
        return createCanvas(MASCOT_GRID_SIZE, MASCOT_GRID_SIZE).canvas;
    }

    const image = await getCachedSkinImage(skin);
    const skinCanvas = getSkinCanvas(image);
    const frames = getAnimationFrames(options.animation ?? "idle");
    const frame = frames[(options.frame ?? 0) % frames.length];
    const hair = averageRegion(skinCanvas.ctx, 40, 8, 8, 8);
    const parts = buildCharacterParts(skinCanvas, options.showHat ?? true);
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
    const itemAnchor = getItemAnchor(options.item ?? "none", torsoX, armY);

    drawCapeBlock(spriteCtx, options.cape ?? "none", 5, 8 + bodyOffset, 10, 8);
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
    drawHeldItem(
        spriteCtx,
        options.item ?? "none",
        itemAnchor.x + (options.itemOffsetX ?? 0),
        itemAnchor.y + (options.itemOffsetY ?? 0)
    );

    const { canvas: outlinedCanvas, ctx: outlinedCtx } = createCanvas(MASCOT_GRID_SIZE, MASCOT_GRID_SIZE);
    drawOutlinedSprite(outlinedCtx, spriteCanvas, outline);

    return composeScene(outlinedCanvas, options);
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
    backgroundCanvas: HTMLCanvasElement | null,
    options: MascotRenderOptions = {}
) {
    const width = backgroundCanvas?.width ?? options.outputSize ?? 300;
    const height = backgroundCanvas?.height ?? options.outputSize ?? 300;
    const frameCanvas = document.createElement("canvas");
    frameCanvas.width = width;
    frameCanvas.height = height;
    const frameCtx = frameCanvas.getContext("2d")!;
    frameCtx.imageSmoothingEnabled = false;

    const gif = GIFEncoder();
    const animation = options.animation ?? "idle";
    const frames = getAnimationFrames(animation);

    for (let index = 0; index < frames.length; index++) {
        const overlay = await buildMascotFrame(skin, {
            ...options,
            frame: index,
            animation
        });

        frameCtx.clearRect(0, 0, width, height);

        if (backgroundCanvas) {
            frameCtx.drawImage(backgroundCanvas, 0, 0);
        }

        frameCtx.drawImage(overlay, 0, 0, width, height);

        const imageData = frameCtx.getImageData(0, 0, width, height);
        const palette = quantize(imageData.data, 256, { format: "rgba4444", oneBitAlpha: true });
        const pixels = applyPalette(imageData.data, palette, "rgba4444");

        gif.writeFrame(pixels, width, height, {
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

export type {
    AnimationMode,
    CapeStyle,
    FrameStyle,
    ItemStyle,
    MascotRenderOptions,
    OrnamentStyle
};
