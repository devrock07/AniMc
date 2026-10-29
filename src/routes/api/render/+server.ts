import type { RequestHandler } from "@sveltejs/kit";
import { preflight, respondWithImage } from "$lib/rendering/http";
import { normalizeBodyRenderOptions, renderPublicImage } from "$lib/rendering/publicRender";

export const OPTIONS = preflight("no-store");

export const POST: RequestHandler = ({ request, url }) =>
	respondWithImage("no-store", async () =>
		renderPublicImage(await normalizeBodyRenderOptions({ request, origin: url.origin }))
	);
