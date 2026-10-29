import adapter from "@sveltejs/adapter-vercel";
import preprocess from "svelte-preprocess";

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: preprocess(),

	kit: {
		// Pin the runtime so local builds work on any Node version and match package.json "engines".
		adapter: adapter({ runtime: "nodejs20.x" }),
		csrf: {
			// The public render API accepts cross-origin form POSTs by design.
			checkOrigin: false
		}
	}
};

export default config;
