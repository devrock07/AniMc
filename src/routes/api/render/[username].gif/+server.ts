import type { RequestHandler } from "@sveltejs/kit";
import { preflight, respondWithImage } from "$lib/rendering/http";
import { normalizeRenderOptions, renderPublicImage } from "$lib/rendering/publicRender";

export const OPTIONS = preflight();

export const GET: RequestHandler = ({ params, url }) =>
	respondWithImage("public", () =>
		renderPublicImage(
			normalizeRenderOptions({
				username: params.username,
				format: "gif",
				origin: url.origin,
				searchParams: url.searchParams
			})
		)
	);
