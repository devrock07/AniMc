import type { RequestHandler } from "@sveltejs/kit";
import { json, preflight } from "$lib/rendering/http";
import { MojangError, getSkin, timeoutSignal } from "$lib/rendering/mojang";

const MAX_SKIN_BYTES = 1024 * 1024;

export const OPTIONS = preflight();

export const GET: RequestHandler = async ({ params }) => {
	const username = params.username?.trim();
	if (!username) return json({ error: "Missing username" }, 400, "no-store");

	try {
		const skinURL = await getSkin(username);
		const response = await fetch(skinURL, { signal: timeoutSignal(5000) });
		if (!response.ok) return json({ error: "Could not download skin" }, 502, "no-store");

		const bytes = await response.arrayBuffer();
		if (bytes.byteLength > MAX_SKIN_BYTES) return json({ error: "Skin is too large" }, 502, "no-store");

		const type = response.headers.get("content-type") ?? "image/png";
		return json({ skin: `data:${type};base64,${Buffer.from(bytes).toString("base64")}` }, 200, "public");
	} catch (error) {
		if (error instanceof MojangError) return json({ error: error.message, message: error.message }, error.status, "no-store");
		console.error("Skin lookup failed:", error);
		return json({ error: "Could not load skin", message: "Could not load skin" }, 502, "no-store");
	}
};
