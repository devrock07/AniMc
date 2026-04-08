import { Canvas, loadImage as loadCanvasImage } from "@napi-rs/canvas";
import { GIFEncoder, applyPalette, quantize } from "gifenc/dist/gifenc.esm.js";
import { loadImage } from "./image";
import { getSkin, valid } from "./mojang";

type RenderStyle = "classic" | "mascot";
type RenderFormat = "png" | "gif";
type AnimationMode = "none" | "idle";
type BackgroundMode = "gradient" | "image" | "transparent";
type OrnamentStyle = "none" | "sparkles" | "halo" | "crown";
type FrameStyle = "none" | "pixel" | "glass" | "studio";
type CapeStyle = "none" | "classic" | "royal";
type ItemStyle = "none" | "sword" | "wand" | "pickaxe";
type ImageSource = string | Buffer;
type LoadedImage = any;
type RawRenderInput = URLSearchParams | FormData | Record<string, unknown>;

type RenderRequestOptions = {
    origin: string;
    format: RenderFormat;
    style: RenderStyle;
    animation: AnimationMode;
    size: number;
    colors: string[];
    background: BackgroundMode;
    username?: string;
    skinSource?: ImageSource;
    backgroundImage?: ImageSource;
    showHat: boolean;
    ornament: OrnamentStyle;
    frame: FrameStyle;
    cape: CapeStyle;
    item: ItemStyle;
    scale: number;
    rotate: number;
    offsetX: number;
    offsetY: number;
    itemOffsetX: number;
    itemOffsetY: number;
    ornamentOffsetX: number;
    ornamentOffsetY: number;
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
    image: LoadedImage;
};

type ClassicAssets = {
    backdrop: LoadedImage;
    shading: LoadedImage;
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
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function createCanvas(width: number, height: number) {
    const canvas = new Canvas(width, height);
    const ctx = canvas.getContext("2d") as unknown as CanvasRenderingContext2D;
    ctx.imageSmoothingEnabled = false;
    return { canvas, ctx };
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function toRadians(degrees: number) {
    return (degrees * Math.PI) / 180;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isFile(value: unknown): value is File {
    return typeof File !== "undefined" && value instanceof File;
}

function getInputValue(input: RawRenderInput, keys: string[]) {
    for (const key of keys) {
        if (input instanceof URLSearchParams) {
            const value = input.get(key);
            if (value !== null) return value;
            continue;
        }

        if (input instanceof FormData) {
            const value = input.get(key);
            if (value !== null) return value;
            continue;
        }

        if (key in input) {
            return input[key];
        }
    }

    return null;
}

function getScalarString(value: unknown) {
    if (typeof value === "string") {
        const trimmed = value.trim();
        return trimmed ? trimmed : null;
    }

    if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }

    return null;
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

function parseIntegerParam(
    value: string | null,
    fallback: number,
    min: number,
    max: number,
    label: string
) {
    if (!value) return fallback;

    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
        throw new PublicRenderError(400, `${label} must be a number`);
    }

    return clamp(parsed, min, max);
}

function parseFloatParam(
    value: string | null,
    fallback: number,
    min: number,
    max: number,
    label: string
) {
    if (!value) return fallback;

    const parsed = Number.parseFloat(value);
    if (!Number.isFinite(parsed)) {
        throw new PublicRenderError(400, `${label} must be a number`);
    }

    return clamp(parsed, min, max);
}

function parseBooleanParam(value: string | null, fallback: boolean) {
    if (!value) return fallback;

    const normalized = value.toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) return true;
    if (["0", "false", "no", "off"].includes(normalized)) return false;

    throw new PublicRenderError(400, "boolean parameters must be true/false");
}

function parseStyleParam(value: string | null, format: RenderFormat): RenderStyle {
    const normalized = value?.toLowerCase() ?? null;

    if (!normalized) {
        return format === "gif" ? "mascot" : "classic";
    }

    if (normalized === "classic" || normalized === "normal") {
        if (format === "gif") {
            throw new PublicRenderError(400, "GIF output is mascot-only. Use PNG for classic renders.");
        }

        return "classic";
    }

    if (normalized === "mascot") return "mascot";

    throw new PublicRenderError(400, "style must be classic or mascot");
}

function parseAnimationParam(value: string | null, format: RenderFormat): AnimationMode {
    if (!value) {
        return format === "gif" ? "idle" : "none";
    }

    if (value === "none" || value === "idle") return value;

    throw new PublicRenderError(400, "animation must be none or idle");
}

function parseFormat(value: string | null): RenderFormat {
    if (!value || value === "png") return "png";
    if (value === "gif") return "gif";
    throw new PublicRenderError(400, "format must be png or gif");
}

function parseBackgroundParam(value: string | null, hasImage: boolean): BackgroundMode {
    if (!value) return hasImage ? "image" : "gradient";

    const normalized = value.toLowerCase();

    if (normalized === "gradient") return "gradient";
    if (normalized === "image") return "image";
    if (normalized === "transparent" || normalized === "none" || normalized === "nobg") {
        return "transparent";
    }

    throw new PublicRenderError(400, "background must be gradient, image, or transparent");
}

function parseFrameParam(value: string | null): FrameStyle {
    if (!value) return "none";

    if (value === "none" || value === "pixel" || value === "glass" || value === "studio") {
        return value;
    }

    throw new PublicRenderError(400, "frame must be none, pixel, glass, or studio");
}

function parseOrnamentParam(value: string | null): OrnamentStyle {
    if (!value) return "none";

    if (value === "none" || value === "sparkles" || value === "halo" || value === "crown") {
        return value;
    }

    throw new PublicRenderError(400, "ornament must be none, sparkles, halo, or crown");
}

function parseCapeParam(value: string | null): CapeStyle {
    if (!value) return "none";

    if (value === "none" || value === "classic" || value === "royal") {
        return value;
    }

    throw new PublicRenderError(400, "cape must be none, classic, or royal");
}

function parseItemParam(value: string | null): ItemStyle {
    if (!value) return "none";

    if (value === "none" || value === "sword" || value === "wand" || value === "pickaxe") {
        return value;
    }

    throw new PublicRenderError(400, "item must be none, sword, wand, or pickaxe");
}

function isImageLikeString(value: string) {
    return value.startsWith("data:image/") || /^https?:\/\//i.test(value);
}

async function parseImageSourceValue(value: unknown, label: string) {
    if (value === null || value === undefined) return undefined;

    if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return undefined;

        if (isImageLikeString(trimmed)) return trimmed;

        throw new PublicRenderError(400, `${label} must be a data URL, http URL, or uploaded file`);
    }

    if (isFile(value)) {
        if (value.size > MAX_UPLOAD_BYTES) {
            throw new PublicRenderError(413, `${label} is too large`);
        }

        const buffer = Buffer.from(await value.arrayBuffer());
        return buffer.length ? buffer : undefined;
    }

    throw new PublicRenderError(400, `${label} must be a string URL or file`);
}

function buildNormalizedOptions(params: {
    origin: string;
    format: RenderFormat;
    input: RawRenderInput;
    username?: string;
    skinSource?: ImageSource;
    backgroundImage?: ImageSource;
}) {
    const usernameValue =
        params.username?.trim() ??
        getScalarString(getInputValue(params.input, ["username", "ign"])) ??
        undefined;
    const style = parseStyleParam(
        getScalarString(getInputValue(params.input, ["style"])),
        params.format
    );
    const animation = parseAnimationParam(
        getScalarString(getInputValue(params.input, ["animation"])),
        params.format
    );
    const size = parseIntegerParam(
        getScalarString(getInputValue(params.input, ["size"])),
        DEFAULT_SIZE,
        MIN_SIZE,
        MAX_SIZE,
        "size"
    );
    const colors = parseGradientParam(
        getScalarString(getInputValue(params.input, ["gradient", "colors"]))
    );
    const backgroundField = getInputValue(params.input, ["background"]);
    const explicitBackground =
        typeof backgroundField === "string" && !isImageLikeString(backgroundField)
            ? backgroundField
            : getScalarString(getInputValue(params.input, ["backgroundMode", "bg"]));
    const background = parseBackgroundParam(explicitBackground, Boolean(params.backgroundImage));

    if (background === "image" && !params.backgroundImage) {
        throw new PublicRenderError(400, "background=image requires an uploaded or data URL background image");
    }

    const showHat = parseBooleanParam(
        getScalarString(getInputValue(params.input, ["hat", "helmet"])),
        true
    );
    const frame = parseFrameParam(getScalarString(getInputValue(params.input, ["frame"])));
    const ornament = parseOrnamentParam(
        getScalarString(getInputValue(params.input, ["ornament", "ornaments"]))
    );
    const cape = parseCapeParam(getScalarString(getInputValue(params.input, ["cape"])));
    const item = parseItemParam(getScalarString(getInputValue(params.input, ["item"])));
    const scale = parseFloatParam(
        getScalarString(getInputValue(params.input, ["scale"])),
        1,
        0.75,
        1.4,
        "scale"
    );
    const rotate = parseFloatParam(
        getScalarString(getInputValue(params.input, ["rotate"])),
        0,
        -20,
        20,
        "rotate"
    );
    const offsetX = parseIntegerParam(
        getScalarString(getInputValue(params.input, ["x", "offsetX"])),
        0,
        -4,
        4,
        "x"
    );
    const offsetY = parseIntegerParam(
        getScalarString(getInputValue(params.input, ["y", "offsetY"])),
        0,
        -4,
        4,
        "y"
    );
    const itemOffsetX = parseIntegerParam(
        getScalarString(getInputValue(params.input, ["itemX", "itemOffsetX"])),
        0,
        -5,
        5,
        "itemX"
    );
    const itemOffsetY = parseIntegerParam(
        getScalarString(getInputValue(params.input, ["itemY", "itemOffsetY"])),
        0,
        -5,
        5,
        "itemY"
    );
    const ornamentOffsetX = parseIntegerParam(
        getScalarString(getInputValue(params.input, ["ornamentX", "ornamentOffsetX"])),
        0,
        -5,
        5,
        "ornamentX"
    );
    const ornamentOffsetY = parseIntegerParam(
        getScalarString(getInputValue(params.input, ["ornamentY", "ornamentOffsetY"])),
        0,
        -5,
        5,
        "ornamentY"
    );

    if (!params.skinSource) {
        if (!usernameValue) {
            throw new PublicRenderError(400, "Missing username or skin");
        }

        if (!valid(usernameValue)) {
            throw new PublicRenderError(
                400,
                "Username must be 1-16 characters and use only letters, numbers, or underscores"
            );
        }
    }

    const normalized: RenderRequestOptions = {
        origin: params.origin,
        format: params.format,
        style,
        animation,
        size,
        colors,
        background,
        username: usernameValue,
        skinSource: params.skinSource,
        backgroundImage: params.backgroundImage,
        showHat,
        ornament,
        frame,
        cape,
        item,
        scale,
        rotate,
        offsetX,
        offsetY,
        itemOffsetX,
        itemOffsetY,
        ornamentOffsetX,
        ornamentOffsetY
    };

    return normalized;
}

function normalizeRenderOptions(params: {
    username: string | undefined;
    format: string;
    origin: string;
    searchParams: URLSearchParams;
}): RenderRequestOptions {
    return buildNormalizedOptions({
        username: params.username,
        format: parseFormat(params.format),
        origin: params.origin,
        input: params.searchParams
    });
}

async function normalizeBodyRenderOptions(params: {
    request: Request;
    origin: string;
}) {
    const contentType = params.request.headers.get("content-type")?.toLowerCase() ?? "";
    let input: RawRenderInput;

    try {
        if (contentType.includes("application/json")) {
            const body = await params.request.json();
            if (!isPlainObject(body)) {
                throw new PublicRenderError(400, "JSON body must be an object");
            }

            input = body;
        } else if (
            contentType.includes("multipart/form-data") ||
            contentType.includes("application/x-www-form-urlencoded")
        ) {
            input = await params.request.formData();
        } else {
            throw new PublicRenderError(
                415,
                "POST /api/render expects application/json or multipart/form-data"
            );
        }
    } catch (error) {
        if (error instanceof PublicRenderError) throw error;
        throw new PublicRenderError(400, "Invalid request body");
    }

    const format = parseFormat(getScalarString(getInputValue(input, ["format"])));
    const skinSource = await parseImageSourceValue(
        getInputValue(input, ["skin", "skinData", "skinUrl"]),
        "skin"
    );
    const rawBackgroundField = getInputValue(input, ["background"]);
    const backgroundImage = await parseImageSourceValue(
        getInputValue(input, ["backgroundImage", "image"]) ??
            (typeof rawBackgroundField === "string" && !isImageLikeString(rawBackgroundField)
                ? null
                : rawBackgroundField),
        "background image"
    );

    return buildNormalizedOptions({
        origin: params.origin,
        format,
        input,
        skinSource,
        backgroundImage
    });
}

function drawGradient(ctx: CanvasRenderingContext2D, colours: string[]) {
    const gradient = ctx.createLinearGradient(0, GRID_SIZE, GRID_SIZE, 0);
    const lastIndex = Math.max(1, colours.length - 1);

    colours.forEach((colour, index) => {
        gradient.addColorStop(index / lastIndex, colour);
    });

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GRID_SIZE, GRID_SIZE);
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

function drawImageCover(
    ctx: CanvasRenderingContext2D,
    image: LoadedImage,
    width: number,
    height: number
) {
    const sourceRatio = image.width / image.height;
    const targetRatio = width / height;
    let sx = 0;
    let sy = 0;
    let sw = image.width;
    let sh = image.height;

    if (sourceRatio > targetRatio) {
        sw = image.height * targetRatio;
        sx = (image.width - sw) / 2;
    } else {
        sh = image.width / targetRatio;
        sy = (image.height - sh) / 2;
    }

    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, width, height);
}

async function buildBackgroundCanvas(options: RenderRequestOptions) {
    const { canvas, ctx } = createCanvas(GRID_SIZE, GRID_SIZE);

    if (options.background === "gradient") {
        drawGradient(ctx, options.colors);
    } else if (options.background === "image" && options.backgroundImage) {
        const image = await loadRenderableImage(options.backgroundImage);
        drawImageCover(ctx, image, GRID_SIZE, GRID_SIZE);
    }

    return canvas;
}

function buildOutputCanvas(scene: Canvas, size: number) {
    const { canvas, ctx } = createCanvas(size, size);
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(scene as any, 0, 0, size, size);
    return canvas;
}

async function loadClassicAssets(origin: string) {
    const backdrop = await loadImage(new URL("/backdropshading.png", origin).toString());
    const shading = await loadImage(new URL("/20x20pshading.png", origin).toString());

    return { backdrop, shading };
}

async function loadRenderableImage(source: ImageSource) {
    if (typeof source === "string") {
        return loadImage(source);
    }

    return loadCanvasImage(source);
}

async function getSkinImage(options: RenderRequestOptions) {
    try {
        if (options.skinSource) {
            return await loadRenderableImage(options.skinSource);
        }

        const skinURL = await getSkin(options.username!);
        return await loadRenderableImage(skinURL);
    } catch (error) {
        const label = options.username ?? "uploaded skin";
        throw new PublicRenderError(404, `Could not load skin for ${label}`);
    }
}

function drawClassicBody(
    ctx: CanvasRenderingContext2D,
    skinImage: LoadedImage,
    bodyOffset = 0,
    showHat = true
) {
    if (skinImage.height === 32) {
        ctx.drawImage(skinImage, 8, 9, 7, 7, 8, 4 + bodyOffset, 7, 7);
        ctx.drawImage(skinImage, 5, 9, 3, 7, 5, 4 + bodyOffset, 3, 7);
        ctx.drawImage(skinImage, 44, 20, 3, 7, 12, 13 + bodyOffset, 3, 7);
        ctx.drawImage(skinImage, 21, 20, 6, 1, 7, 11 + bodyOffset, 6, 1);
        ctx.drawImage(skinImage, 20, 21, 8, 8, 6, 12 + bodyOffset, 8, 8);
        ctx.drawImage(skinImage, 44, 20, 3, 7, 5, 13 + bodyOffset, 3, 7);

        if (showHat) {
            ctx.drawImage(skinImage, 40, 9, 7, 7, 8, 4 + bodyOffset, 7, 7);
            ctx.drawImage(skinImage, 33, 9, 3, 7, 5, 4 + bodyOffset, 3, 7);
        }

        return;
    }

    ctx.drawImage(skinImage, 8, 9, 7, 7, 8, 4 + bodyOffset, 7, 7);
    ctx.drawImage(skinImage, 5, 9, 3, 7, 5, 4 + bodyOffset, 3, 7);
    ctx.drawImage(skinImage, 36, 52, 3, 7, 12, 13 + bodyOffset, 3, 7);
    ctx.drawImage(skinImage, 21, 20, 6, 1, 7, 11 + bodyOffset, 6, 1);
    ctx.drawImage(skinImage, 20, 21, 8, 8, 6, 12 + bodyOffset, 8, 8);
    ctx.drawImage(skinImage, 44, 20, 3, 7, 5, 13 + bodyOffset, 3, 7);

    if (showHat) {
        ctx.drawImage(skinImage, 40, 9, 7, 7, 8, 4 + bodyOffset, 7, 7);
        ctx.drawImage(skinImage, 33, 9, 3, 7, 5, 4 + bodyOffset, 3, 7);
    }

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

function getMascotAnimationFrames(animation: AnimationMode): MascotFrameSpec[] {
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

function getSkinCanvas(image: LoadedImage): SkinCanvas {
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

function drawOrnamentLayer(ctx: CanvasRenderingContext2D, options: RenderRequestOptions) {
    const ornamentX = options.offsetX + options.ornamentOffsetX;
    const ornamentY = options.offsetY + options.ornamentOffsetY;
    const centerX = 10 + ornamentX;
    const topY = clamp(2 + ornamentY, 1, 8);

    if (options.ornament === "sparkles") {
        drawPixelSparkle(ctx, 2 + ornamentX, 4 + ornamentY, "#f7fbff");
        drawPixelSparkle(ctx, 15 + ornamentX, 3 + ornamentY, "#e0fdff");
        drawPixelSparkle(ctx, 14 + ornamentX, 13 + ornamentY, "#d4fdff");
        return;
    }

    if (options.ornament === "halo") {
        drawRect(ctx, "#f4b942", centerX - 3, topY, 7, 1);
        drawRect(ctx, "#ffe39a", centerX - 2, topY - 1, 5, 1);
        drawRect(ctx, "#8f5b0a", centerX - 4, topY, 1, 1);
        drawRect(ctx, "#8f5b0a", centerX + 3, topY, 1, 1);
        return;
    }

    if (options.ornament === "crown") {
        drawRect(ctx, "#c07a18", centerX - 3, topY + 1, 7, 1);
        drawRect(ctx, "#ffd05a", centerX - 2, topY, 1, 1);
        drawRect(ctx, "#ffd05a", centerX, topY - 1, 1, 2);
        drawRect(ctx, "#ffd05a", centerX + 2, topY, 1, 1);
        drawRect(ctx, "#ff5d7a", centerX, topY, 1, 1);
    }
}

function drawFrameLayer(ctx: CanvasRenderingContext2D, frame: FrameStyle) {
    if (frame === "none") return;

    if (frame === "pixel") {
        drawRect(ctx, "rgba(0, 0, 0, 0.46)", 0, 0, GRID_SIZE, 1);
        drawRect(ctx, "rgba(0, 0, 0, 0.46)", 0, GRID_SIZE - 1, GRID_SIZE, 1);
        drawRect(ctx, "rgba(0, 0, 0, 0.46)", 0, 0, 1, GRID_SIZE);
        drawRect(ctx, "rgba(0, 0, 0, 0.46)", GRID_SIZE - 1, 0, 1, GRID_SIZE);
        drawRect(ctx, "rgba(255, 255, 255, 0.24)", 1, 1, GRID_SIZE - 2, 1);
        drawRect(ctx, "rgba(255, 255, 255, 0.12)", 1, 1, 1, GRID_SIZE - 2);
        return;
    }

    if (frame === "glass") {
        drawRect(ctx, "rgba(6, 14, 24, 0.58)", 0, 0, GRID_SIZE, 2);
        drawRect(ctx, "rgba(6, 14, 24, 0.58)", 0, GRID_SIZE - 2, GRID_SIZE, 2);
        drawRect(ctx, "rgba(6, 14, 24, 0.58)", 0, 0, 2, GRID_SIZE);
        drawRect(ctx, "rgba(6, 14, 24, 0.58)", GRID_SIZE - 2, 0, 2, GRID_SIZE);
        drawRect(ctx, "rgba(180, 236, 255, 0.32)", 1, 1, GRID_SIZE - 2, 1);
        drawRect(ctx, "rgba(180, 236, 255, 0.18)", 1, 2, GRID_SIZE - 2, 1);
        return;
    }

    drawRect(ctx, "rgba(69, 34, 16, 0.76)", 0, 0, GRID_SIZE, 2);
    drawRect(ctx, "rgba(69, 34, 16, 0.76)", 0, GRID_SIZE - 2, GRID_SIZE, 2);
    drawRect(ctx, "rgba(69, 34, 16, 0.76)", 0, 0, 2, GRID_SIZE);
    drawRect(ctx, "rgba(69, 34, 16, 0.76)", GRID_SIZE - 2, 0, 2, GRID_SIZE);
    drawRect(ctx, "rgba(255, 208, 90, 0.36)", 2, 2, GRID_SIZE - 4, 1);
    drawRect(ctx, "rgba(255, 208, 90, 0.18)", 2, GRID_SIZE - 3, GRID_SIZE - 4, 1);
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

function buildHeadCanvas(skin: SkinCanvas, showHat: boolean) {
    const head = composeRegion(skin, [8, 8, 8, 8]);
    const ctx = head.getContext("2d") as unknown as CanvasRenderingContext2D;
    const hasHat = showHat && hasOpaquePixels(skin.ctx, 40, 8, 8, 8);

    if (hasHat) {
        ctx.drawImage(skin.canvas as any, 40, 8, 8, 3, 0, 0, 8, 3);
        ctx.drawImage(skin.canvas as any, 40, 11, 2, 5, 0, 3, 2, 5);
        ctx.drawImage(skin.canvas as any, 46, 11, 2, 5, 6, 3, 2, 5);
    }

    return head;
}

function getArmRegions(image: LoadedImage) {
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

function getLegRegions(image: LoadedImage) {
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

function buildCharacterParts(skin: SkinCanvas, showHat: boolean) {
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

function getItemAnchor(item: ItemStyle, torsoX: number, armY: number) {
    if (item === "pickaxe") {
        return { x: torsoX + 4, y: armY - 1 };
    }

    if (item === "wand") {
        return { x: torsoX + 6, y: armY };
    }

    return { x: torsoX + 5, y: armY - 1 };
}

function renderClassicSprite(
    skinImage: LoadedImage,
    assets: ClassicAssets | null,
    frame: ClassicFrameSpec,
    options: RenderRequestOptions
) {
    const { canvas, ctx } = createCanvas(GRID_SIZE, GRID_SIZE);
    ctx.clearRect(0, 0, GRID_SIZE, GRID_SIZE);

    if (assets) {
        ctx.drawImage(assets.backdrop, 0, 0, GRID_SIZE, GRID_SIZE);
    }

    drawCapeBlock(ctx, options.cape, 5, 5 + frame.bodyOffset, 10, 11);
    drawClassicBody(ctx, skinImage, frame.bodyOffset, options.showHat);
    drawHeldItem(
        ctx,
        options.item,
        13 + options.itemOffsetX,
        11 + frame.bodyOffset + options.itemOffsetY
    );

    if (assets) {
        ctx.drawImage(assets.shading, 0, 0, GRID_SIZE, GRID_SIZE);
    }

    return canvas;
}

function renderMascotSprite(
    skinImage: LoadedImage,
    frame: MascotFrameSpec,
    options: RenderRequestOptions
) {
    const skinCanvas = getSkinCanvas(skinImage);
    const hair = averageRegion(skinCanvas.ctx, 40, 8, 8, 8);
    const parts = buildCharacterParts(skinCanvas, options.showHat);
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
    const itemAnchor = getItemAnchor(options.item, torsoX, armY);

    drawCapeBlock(spriteCtx, options.cape, 5, 8 + bodyOffset, 10, 8);

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
    spriteCtx.drawImage(parts.torso as any, torsoX, torsoY, 6, 5);
    spriteCtx.drawImage(parts.head as any, headX, headY, 8, 8);
    drawHeldItem(
        spriteCtx,
        options.item,
        itemAnchor.x + options.itemOffsetX,
        itemAnchor.y + options.itemOffsetY
    );

    const { canvas, ctx: finalCtx } = createCanvas(GRID_SIZE, GRID_SIZE);

    if (options.background !== "transparent") {
        drawRect(finalCtx, "rgba(0, 0, 0, 0.18)", 5, 19, 10, 1);
        drawRect(finalCtx, "rgba(0, 0, 0, 0.1)", 6, 18, 8, 1);
    }

    drawOutlinedSprite(finalCtx, spriteCanvas, outline);
    return canvas;
}

function composeScene(
    background: Canvas,
    sprite: Canvas,
    options: RenderRequestOptions
) {
    const { canvas, ctx } = createCanvas(GRID_SIZE, GRID_SIZE);

    if (options.background !== "transparent") {
        ctx.drawImage(background as any, 0, 0, GRID_SIZE, GRID_SIZE);
    }

    ctx.save();
    ctx.translate(GRID_SIZE / 2 + options.offsetX, GRID_SIZE / 2 + options.offsetY);
    ctx.rotate(toRadians(options.rotate));
    ctx.scale(options.scale, options.scale);
    ctx.drawImage(sprite as any, -GRID_SIZE / 2, -GRID_SIZE / 2, GRID_SIZE, GRID_SIZE);
    ctx.restore();

    drawOrnamentLayer(ctx, options);
    drawFrameLayer(ctx, options.frame);

    return canvas;
}

function buildGifFrame(
    scene: Canvas,
    size: number,
    frameCanvas: Canvas,
    frameCtx: CanvasRenderingContext2D
) {
    frameCtx.clearRect(0, 0, size, size);
    frameCtx.drawImage(scene as any, 0, 0, size, size);
    return frameCanvas;
}

function buildCorsHeaders(
    contentType?: string,
    cacheControl = "public, max-age=0, s-maxage=3600"
) {
    const headers: Record<string, string> = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": cacheControl
    };

    if (contentType) {
        headers["Content-Type"] = contentType;
    }

    return headers;
}

async function renderPng(options: RenderRequestOptions) {
    const skinImage = await getSkinImage(options);
    const background = await buildBackgroundCanvas(options);
    const sprite =
        options.style === "mascot"
            ? renderMascotSprite(skinImage, getMascotAnimationFrames("none")[0], options)
            : renderClassicSprite(
                  skinImage,
                  options.background === "transparent" ? null : await loadClassicAssets(options.origin),
                  getClassicAnimationFrames("none")[0],
                  options
              );

    const scene = composeScene(background, sprite, options);
    const output = buildOutputCanvas(scene, options.size);
    return output.toBuffer("image/png");
}

async function renderGif(options: RenderRequestOptions) {
    if (options.style !== "mascot") {
        throw new PublicRenderError(400, "GIF output is mascot-only. Use PNG for classic renders.");
    }

    const skinImage = await getSkinImage(options);
    const background = await buildBackgroundCanvas(options);
    const gif = GIFEncoder();
    const { canvas: frameCanvas, ctx: frameCtx } = createCanvas(options.size, options.size);
    const frames = getMascotAnimationFrames(options.animation);

    for (const frame of frames) {
        const sprite = renderMascotSprite(skinImage, frame, options);
        const scene = composeScene(background, sprite, options);
        buildGifFrame(scene, options.size, frameCanvas, frameCtx);

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
    normalizeBodyRenderOptions,
    normalizeRenderOptions,
    renderPublicImage
};
export type {
    AnimationMode,
    BackgroundMode,
    CapeStyle,
    FrameStyle,
    ItemStyle,
    OrnamentStyle,
    RenderFormat,
    RenderRequestOptions,
    RenderStyle
};
