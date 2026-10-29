const USERNAME_PATTERN = /^[a-z0-9_]{1,16}$/i;
const REQUEST_TIMEOUT_MS = 8000;
const HIT_TTL_MS = 10 * 60 * 1000;
const MISS_TTL_MS = 60 * 1000;
const MAX_CACHE_ENTRIES = 500;

/** Thrown when a Mojang lookup fails. `status` is the HTTP status the API should answer with. */
class MojangError extends Error {
	status: number;

	constructor(status: number, message: string) {
		super(message);
		this.status = status;
	}
}

type CacheEntry = { expires: number; value: Promise<string> };
const skinCache = new Map<string, CacheEntry>();

/** An AbortSignal that fires after `ms` (stand-in for AbortSignal.timeout, which TS 4.5 doesn't type). */
function timeoutSignal(ms: number): AbortSignal {
	const controller = new AbortController();
	setTimeout(() => controller.abort(), ms);
	return controller.signal;
}

function valid(username: string): boolean {
	return USERNAME_PATTERN.test(username);
}

async function fetchJson(url: string, notFoundMessage: string) {
	let response: Response;
	try {
		response = await fetch(url, { signal: timeoutSignal(REQUEST_TIMEOUT_MS) });
	} catch {
		throw new MojangError(504, "Mojang API did not respond in time");
	}

	// Mojang answers unknown names with 404, or 204 on some endpoints.
	if (response.status === 404 || response.status === 204) {
		throw new MojangError(404, notFoundMessage);
	}
	if (response.status === 429) {
		throw new MojangError(503, "Mojang API rate limit reached, try again shortly");
	}
	if (!response.ok) {
		throw new MojangError(502, `Mojang API returned status ${response.status}`);
	}

	return response.json();
}

async function getUUID(username: string): Promise<string> {
	if (!valid(username)) throw new MojangError(400, `${username} is an invalid username`);
	const json = await fetchJson(
		`https://api.mojang.com/users/profiles/minecraft/${username}`,
		`${username} does not exist`
	);
	return json.id;
}

async function lookupSkin(username: string): Promise<string> {
	const uuid = await getUUID(username);
	const json = await fetchJson(
		`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`,
		`${username} does not exist`
	);
	const encoded = json.properties?.find((p: { name: string }) => p.name === "textures")?.value;
	if (!encoded) throw new MojangError(502, "Mojang profile has no texture data");

	const skinUrl = JSON.parse(atob(encoded)).textures?.SKIN?.url;
	if (!skinUrl) throw new MojangError(404, `${username} has no custom skin`);
	return skinUrl;
}

/** Resolves a username to its skin URL. Results (and misses) are cached briefly to spare Mojang's rate limit. */
async function getSkin(username: string): Promise<string> {
	if (!valid(username)) throw new MojangError(400, `${username} is an invalid username`);

	const key = username.toLowerCase();
	const now = Date.now();
	const cached = skinCache.get(key);
	if (cached && cached.expires > now) return cached.value;

	const value = lookupSkin(username);
	const entry: CacheEntry = { expires: now + HIT_TTL_MS, value };
	skinCache.set(key, entry);

	if (skinCache.size > MAX_CACHE_ENTRIES) {
		// Map keeps insertion order, so the first key is the oldest.
		skinCache.delete(skinCache.keys().next().value!);
	}

	value.catch((error) => {
		// Remember "not found" for a short while; forget other failures so they retry.
		if (error instanceof MojangError && error.status === 404) {
			entry.expires = Date.now() + MISS_TTL_MS;
		} else {
			skinCache.delete(key);
		}
	});

	return value;
}

export { MojangError, getSkin, getUUID, timeoutSignal, valid };
