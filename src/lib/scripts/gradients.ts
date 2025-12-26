let selected = 0;

// top - bottom
const gradients: string[][] = [
	["#00cdac", "#02aab0"], // Teal
	["#6a82fb", "#fc5c7d"], // Purple-Pink
	["#ffb88c", "#de6262"], // Sunset
	["#f45c43", "#eb3349"], // Orange-Red
	["#B5AC49", "#3CA55C"], // Nature
	["#a18cd1", "#fbc2eb"], // Dreamy Purple
	["#84fab0", "#8fd3f4"], // Aqua Blue
	["#e0c3fc", "#8ec5fc"], // Soft Violet
	["#f093fb", "#f5576c"], // Neon Pink
	["#43e97b", "#38f9d7"], // Neon Green
	["#fa709a", "#fee140"], // Warm Glow
	["#30cfd0", "#330867"], // Deep Sea
	["#a8edea", "#fed6e3"], // Cotton Candy
	["#5f2c82", "#49a09d"], // Mystical
	["#09203f", "#537895"], // Dark Blue
	["#764ba2", "#667eea"], // Royal Blue
	["#ffffff", "#ffffff"], // Solid White
	["#0a0a0a", "#0a0a0a"], // Solid Black
	["#764af1", "#764af1"], // Brand Purple
	["#F44336", "#F44336"], // Red
	["#2196F3", "#2196F3"], // Blue
	["#4CAF50", "#4CAF50"], // Green
	["#FFC107", "#FFC107"], // Yellow
]

function changeGradient(ctx: CanvasRenderingContext2D, orientation?: "left" | "right") {
	if (orientation) {
		selected = orientation === "left" ? selected - 1 : selected + 1;
		if (selected > gradients.length - 1) selected = 0;
		if (selected < 0) selected = gradients.length - 1
	}

	const gradient = ctx.createLinearGradient(0, 15, 0, 0);
	let interval = 1;
	gradients[selected].forEach(colour => {
		gradient.addColorStop(interval, colour)
		interval -= 1 / (gradients[selected].length - 1);
	})
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, 20, 20);
}

function drawCustomGradient(ctx: CanvasRenderingContext2D, colors: string[]) {
	const gradient = ctx.createLinearGradient(0, 15, 0, 0);
	let interval = 1;
	colors.forEach(colour => {
		gradient.addColorStop(interval, colour)
		interval -= 1 / (colors.length - 1);
	})
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, 20, 20);
}

function drawCustomImage(ctx: CanvasRenderingContext2D, image: HTMLImageElement) {
	ctx.drawImage(image, 0, 0, 20, 20);
}

export { changeGradient, drawCustomGradient, drawCustomImage };
export default changeGradient;
