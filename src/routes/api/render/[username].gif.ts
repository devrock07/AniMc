import {
	buildCorsHeaders,
	normalizeRenderOptions,
	PublicRenderError,
	renderPublicImage
} from "$lib/rendering/publicRender";

export function OPTIONS() {
	return new Response(null, {
		status: 204,
		headers: buildCorsHeaders()
	});
}

export async function GET({ params, url }) {
	try {
		const options = normalizeRenderOptions({
			username: params.username,
			format: "gif",
			origin: url.origin,
			searchParams: url.searchParams
		});
		const result = await renderPublicImage(options);

		return new Response(result.body as BodyInit, {
			status: 200,
			headers: buildCorsHeaders(result.contentType)
		});
	} catch (error) {
		const status = error instanceof PublicRenderError ? error.status : 500;
		const message = error instanceof Error ? error.message : "Internal Server Error";

		return new Response(JSON.stringify({ message }), {
			status,
			headers: buildCorsHeaders("application/json")
		});
	}
}
