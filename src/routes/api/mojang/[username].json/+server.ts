import { getSkin, valid } from "$lib/rendering/mojang";
import { buildCorsHeaders } from "$lib/rendering/publicRender";

export function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: buildCorsHeaders()
    });
}

export async function GET({ params }) {
    const username = params.username?.trim();

    if (!username) {
        return new Response(JSON.stringify({ error: "Missing username" }), {
            status: 400,
            headers: buildCorsHeaders("application/json")
        });
    }

    if (!valid(username)) {
        return new Response(JSON.stringify({ error: "Invalid username" }), {
            status: 400,
            headers: buildCorsHeaders("application/json")
        });
    }

    try {
        const skinURL = await getSkin(username);
        const response = await fetch(skinURL);
        const blob = await response.arrayBuffer();
        const buffer = `data:${response.headers.get("content-type")};base64,${Buffer.from(blob).toString("base64")}`;

        return new Response(JSON.stringify({ skin: buffer }), {
            status: 200,
            headers: buildCorsHeaders("application/json")
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "something went wrong";

        return new Response(JSON.stringify({ message }), {
            status: 400,
            headers: buildCorsHeaders("application/json")
        });
    }
}
