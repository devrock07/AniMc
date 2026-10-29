async function loadImage(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image()
		img.crossOrigin = "Anonymous";
		img.src = url
		img.onload = () => {
			resolve(img)
		}
		img.onerror = e => {
			reject(e)
		}
	})
}

/**
 * Returns a drawable copy of a skin. Old 64x32 skins (e.g. Notch's) often have a fully
 * opaque hat layer that Minecraft ignores; like Minecraft, clear it when it has no transparency.
 */
function normalizeSkin(image: HTMLImageElement): HTMLCanvasElement {
	const canvas = document.createElement("canvas");
	canvas.width = image.width;
	canvas.height = image.height;
	const ctx = canvas.getContext("2d")!;
	ctx.drawImage(image, 0, 0);

	if (image.height === 32) {
		const hat = ctx.getImageData(32, 0, 32, 16).data;
		let hasTransparency = false;
		for (let index = 3; index < hat.length; index += 4) {
			if (hat[index] < 128) {
				hasTransparency = true;
				break;
			}
		}
		if (!hasTransparency) ctx.clearRect(32, 0, 32, 16);
	}

	return canvas;
}

async function mergeCanvases(canvases: HTMLCanvasElement[]) {
	const canvas = document.createElement("canvas");
	canvas.width = canvases[0].width;
	canvas.height = canvases[0].height;

	const ctx = canvas.getContext("2d")!;
	// Canvases can be drawn directly; no need to round-trip through a data URL.
	for (const c of canvases) {
		ctx.drawImage(c, 0, 0);
	}

	return canvas
}

export {
	loadImage,
	mergeCanvases,
	normalizeSkin
}