import { browser } from '$app/environment';

export async function loadImage(src: string): Promise<any> {
    if (browser) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(e);
            img.crossOrigin = "Anonymous";
            img.src = src;
        });
    } else {
        // Dynamic import to avoid bundling native module for client
        const { loadImage: canvasLoadImage } = await import('@napi-rs/canvas');
        return canvasLoadImage(src);
    }
}
