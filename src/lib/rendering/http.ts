import { buildCorsHeaders, PublicRenderError } from "./publicRender";

type CacheMode = "public" | "no-store";

function cacheHeader(mode: CacheMode) {
	// Renders for a username can be cached at the edge; mascot skins rarely change.
	return mode === "public" ? "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400" : "no-store";
}

function json(body: unknown, status: number, cache: CacheMode) {
	return new Response(JSON.stringify(body), {
		status,
		headers: buildCorsHeaders("application/json", cacheHeader(cache))
	});
}

/** CORS preflight response shared by every API route. */
function preflight(cache: CacheMode = "public") {
	return () => new Response(null, { status: 204, headers: buildCorsHeaders(undefined, cacheHeader(cache)) });
}

/**
 * Runs a render and turns the result (or any error) into an HTTP response.
 * Known errors keep their status and message; unexpected ones are logged and hidden from callers.
 */
async function respondWithImage(
	cache: CacheMode,
	render: () => Promise<{ body: Buffer | Uint8Array; contentType: string }>
) {
	try {
		const result = await render();
		return new Response(result.body as BodyInit, {
			status: 200,
			headers: buildCorsHeaders(result.contentType, cacheHeader(cache))
		});
	} catch (error) {
		if (error instanceof PublicRenderError) {
			// Errors are cheap to recompute and may be temporary, so never cache them publicly.
			return json({ message: error.message }, error.status, "no-store");
		}

		console.error("Render failed:", error);
		return json({ message: "Internal Server Error" }, 500, "no-store");
	}
}

export { json, preflight, respondWithImage };
