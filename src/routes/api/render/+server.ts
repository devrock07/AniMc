import {
    buildCorsHeaders,
    normalizeBodyRenderOptions,
    PublicRenderError,
    renderPublicImage
} from "$lib/rendering/publicRender";

export function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: buildCorsHeaders(undefined, "no-store")
    });
}

export async function POST({ request, url }) {
    try {
        const options = await normalizeBodyRenderOptions({
            request,
            origin: url.origin
        });
        const result = await renderPublicImage(options);

        return new Response(result.body as BodyInit, {
            status: 200,
            headers: buildCorsHeaders(result.contentType, "no-store")
        });
    } catch (error) {
        const status = error instanceof PublicRenderError ? error.status : 500;
        const message = error instanceof Error ? error.message : "Internal Server Error";

        return new Response(JSON.stringify({ message }), {
            status,
            headers: buildCorsHeaders("application/json", "no-store")
        });
    }
}
