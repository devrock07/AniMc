<script lang="ts">
    const endpoints = [
        {
            title: "PNG Render",
            path: "/api/render/notch.png",
            note: "Static image output for classic or mascot renders."
        },
        {
            title: "GIF Render",
            path: "/api/render/notch.gif?style=mascot&animation=idle",
            note: "Animated output for mascot or classic idle loops."
        },
        {
            title: "Legacy PNG",
            path: "/api/pfp/notch.png",
            note: "Backward-compatible classic endpoint, now using the same renderer."
        }
    ];

    const params = [
        {
            name: "style",
            values: "`classic` | `mascot` | `normal`",
            description: "Choose the standard AniMc render or the pixel mascot render."
        },
        {
            name: "animation",
            values: "`none` | `idle`",
            description: "Controls GIF motion. PNG requests always return a single frame."
        },
        {
            name: "gradient",
            values: "`00cdac-02aab0`",
            description: "Custom background gradient using two or more hex colours separated by `-`."
        },
        {
            name: "size",
            values: "`64` to `1024`",
            description: "Final exported width and height in pixels. Default is `300`."
        }
    ];

    const siteUrl = "https://animc.d4vrock.xyz";

    const examples = [
        `${siteUrl}/api/render/devrock14.png?style=classic&gradient=00cdac-02aab0`,
        `${siteUrl}/api/render/devrock14.png?style=mascot&gradient=ffb88c-de6262`,
        `${siteUrl}/api/render/devrock14.gif?style=mascot&animation=idle&gradient=84fab0-8fd3f4`,
        `${siteUrl}/api/render/devrock14.gif?style=classic&animation=idle&size=512`
    ];

    const botExample = `const url = \`https://animc.d4vrock.xyz/api/render/\${ign}.gif?style=mascot&animation=idle\`;
const response = await fetch(url);
const bytes = Buffer.from(await response.arrayBuffer());

const file = new AttachmentBuilder(bytes, {
  name: \`\${ign}.gif\`
});`;
</script>

<svelte:head>
    <title>AniMc API</title>
    <meta
        name="description"
        content="AniMc API docs for generating Minecraft PNG and GIF avatars in classic and mascot styles."
    />
</svelte:head>

<div class="api-page">
    <section class="hero">
        <p class="eyebrow">AniMc API</p>
        <h1>Generate Minecraft PNGs and GIFs from a simple URL</h1>
        <p class="lede">
            Use AniMc as an image backend for Discord bots, websites, dashboards, or
            automations. Every endpoint supports public CORS, so other apps can fetch the
            render directly.
        </p>
    </section>

    <section class="card-grid">
        {#each endpoints as endpoint}
            <article class="card endpoint-card">
                <div class="card-label">{endpoint.title}</div>
                <code>{endpoint.path}</code>
                <p>{endpoint.note}</p>
            </article>
        {/each}
    </section>

    <section class="card">
        <div class="section-heading">Query Params</div>
        <div class="param-list">
            {#each params as param}
                <div class="param-row">
                    <div class="param-name">{param.name}</div>
                    <div class="param-values">{param.values}</div>
                    <div class="param-description">{param.description}</div>
                </div>
            {/each}
        </div>
    </section>

    <section class="card">
        <div class="section-heading">Examples</div>
        <div class="snippet-list">
            {#each examples as example}
                <a class="snippet-link" href={example} target="_blank" rel="noreferrer">
                    <code>{example}</code>
                </a>
            {/each}
        </div>
    </section>

    <section class="card">
        <div class="section-heading">Discord Bot Example</div>
        <pre><code>{botExample}</code></pre>
    </section>
</div>

<style lang="scss">
    .api-page {
        width: min(960px, calc(100% - 3rem));
        margin: 0 auto;
        padding: 5rem 0 6rem;
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .hero {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        text-align: center;
        align-items: center;

        h1 {
            margin: 0;
            max-width: 14ch;
            font-size: clamp(3rem, 5vw, 5.4rem);
            line-height: 0.95;
            letter-spacing: -0.05em;
        }
    }

    .eyebrow {
        margin: 0;
        color: var(--accent-color);
        text-transform: uppercase;
        letter-spacing: 0.18em;
        font-size: 1.2rem;
        font-weight: 700;
    }

    .lede {
        margin: 0;
        max-width: 60rem;
        font-size: 1.75rem;
        line-height: 1.6;
        color: var(--text-muted);
    }

    .card-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1.4rem;

        @media (max-width: 820px) {
            grid-template-columns: 1fr;
        }
    }

    .card {
        background: linear-gradient(180deg, rgba(11, 23, 40, 0.86), rgba(9, 20, 36, 0.78));
        border: 1px solid var(--glass-border);
        border-radius: 24px;
        padding: 2rem;
        box-shadow: var(--shadow-soft);
    }

    .endpoint-card {
        display: flex;
        flex-direction: column;
        gap: 1rem;

        p {
            margin: 0;
            color: var(--text-muted);
            line-height: 1.5;
        }
    }

    .card-label,
    .section-heading {
        font-size: 1.35rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--text-muted);
        margin-bottom: 1rem;
    }

    .param-list {
        display: grid;
        gap: 1rem;
    }

    .param-row {
        display: grid;
        grid-template-columns: 12rem 20rem 1fr;
        gap: 1rem;
        align-items: start;
        padding: 1rem 1.2rem;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.04);

        @media (max-width: 820px) {
            grid-template-columns: 1fr;
        }
    }

    .param-name {
        font-size: 1.6rem;
        font-weight: 700;
        color: var(--text-main);
    }

    .param-values,
    .param-description {
        color: var(--text-muted);
        line-height: 1.5;
    }

    .snippet-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .snippet-link {
        text-decoration: none;
        padding: 1rem 1.2rem;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.06);
        transition:
            transform 0.25s ease,
            border-color 0.25s ease,
            background 0.25s ease;

        &:hover {
            transform: translateY(-1px);
            border-color: rgba(53, 208, 255, 0.28);
            background: rgba(53, 208, 255, 0.06);
        }
    }

    code,
    pre {
        font-family: "JetBrains Mono", "Fira Code", monospace;
    }

    code {
        color: #dff6ff;
        font-size: 1.35rem;
        word-break: break-all;
    }

    pre {
        margin: 0;
        padding: 1.4rem;
        border-radius: 18px;
        background: rgba(0, 0, 0, 0.28);
        overflow: auto;
    }
</style>
