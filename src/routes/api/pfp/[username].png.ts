import generatePfp from "$lib/rendering/generateProfile";
import changeGradient from "$lib/rendering/gradient";
import { Canvas } from "@napi-rs/canvas";

export async function GET({ params, url }) {
	if (!params?.username) {
		return new Response(JSON.stringify({ error: "Missing username" }), {
			status: 400,
			headers: { "Content-Type": "application/json" }
		});
	}

	try {
		const username = params.username;
		const searchParams = url.searchParams;
		const gradient = searchParams.get("gradient");
		const colours = gradient ? gradient.split("-").filter(v => v !== "").map(colour => `#${colour}`) : null;

		const canvas = new Canvas(300, 300);
		const ctx = canvas.getContext("2d");
		ctx.scale(16, 16);
		ctx.imageSmoothingEnabled = false;

		changeGradient(ctx, colours);
		await generatePfp(username, ctx);

		const buffer = await canvas.toBuffer("image/png");
		return new Response(buffer as unknown as BodyInit, {
			status: 200,
			headers: { "Content-Type": "image/png" }
		});

	} catch (e) {
		console.error("API Error:", e);
		return new Response(JSON.stringify({ message: "Internal Server Error", error: e.toString() }), {
			status: 500,
			headers: { "Content-Type": "application/json" }
		});
	}
}