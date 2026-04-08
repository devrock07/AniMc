<script lang="ts">
    const siteUrl = "https://animc.d4vrock.xyz";

    const endpoints = [
        {
            method: "GET",
            title: "PNG Render",
            path: "/api/render/[username].png",
            note: "Classic or mascot still renders with gradients, transparent export, frames, ornaments, capes, items, and pose controls."
        },
        {
            method: "GET",
            title: "Mascot GIF",
            path: "/api/render/[username].gif",
            note: "Animated GIF output is mascot-only. Classic GIF is intentionally blocked so the API stays clean."
        },
        {
            method: "POST",
            title: "Upload Render",
            path: "/api/render",
            note: "Send JSON or multipart form data with a username, a skin upload, and an optional background image."
        },
        {
            method: "GET",
            title: "Legacy PNG",
            path: "/api/pfp/[username].png",
            note: "Backwards-compatible classic endpoint for older integrations."
        }
    ];

    const paramGroups = [
        {
            title: "Core",
            items: [
                ["style", "`classic` | `mascot`"],
                ["format", "POST only: `png` | `gif`"],
                ["animation", "`none` | `idle`"],
                ["size", "`64` to `1024`"],
                ["hat", "`true` | `false`"]
            ]
        },
        {
            title: "Background",
            items: [
                ["background", "`gradient` | `transparent` | `image`"],
                ["gradient", "`84fab0-8fd3f4` style hex chain"],
                ["backgroundImage", "POST data URL or uploaded file"],
                ["image", "POST alias for `backgroundImage`"]
            ]
        },
        {
            title: "Style Extras",
            items: [
                ["frame", "`none` | `pixel` | `glass` | `studio`"],
                ["ornament", "`none` | `sparkles` | `halo` | `crown`"],
                ["cape", "`none` | `classic` | `royal`"],
                ["item", "`none` | `sword` | `wand` | `pickaxe`"],
                ["itemX / itemY", "`-5` to `5` accessory position trim"],
                ["ornamentX / ornamentY", "`-5` to `5` ornament position trim"]
            ]
        },
        {
            title: "Pose",
            items: [
                ["scale", "`0.75` to `1.4`"],
                ["rotate", "`-20` to `20`"],
                ["x", "`-4` to `4`"],
                ["y", "`-4` to `4`"]
            ]
        }
    ];

    const roadmap = [
        ["Ornaments", "Live"],
        ["Frames", "Live"],
        ["Core Generator: Java & Upload support", "Live"],
        ["Customization: Backgrounds, Gradients, Images", "Live"],
        ["Mobile Support", "Live"],
        ["3D Adjustments: rotate and position", "Partial"],
        ["Layers: helmet / hat toggle", "Live"],
        ["Cosmetics: capes or items", "Live"]
    ];

    const examples = [
        {
            label: "Classic transparent PNG",
            url: `${siteUrl}/api/render/devrock14.png?style=classic&background=transparent&hat=false&size=512`
        },
        {
            label: "Mascot styled PNG",
            url: `${siteUrl}/api/render/devrock14.png?style=mascot&gradient=ffb88c-de6262&frame=pixel&ornament=sparkles&cape=royal`
        },
        {
            label: "Mascot GIF with cosmetics",
            url: `${siteUrl}/api/render/devrock14.gif?style=mascot&animation=idle&size=512&frame=glass&item=sword`
        }
    ];

    const botExample = `const url = \`${siteUrl}/api/render/\${ign}.gif?style=mascot&animation=idle&frame=glass\`;
const response = await fetch(url);
const bytes = Buffer.from(await response.arrayBuffer());

const file = new AttachmentBuilder(bytes, {
  name: \`\${ign}.gif\`
});`;

    const uploadExample = `const form = new FormData();
form.append("format", "png");
form.append("style", "mascot");
form.append("background", "image");
form.append("frame", "studio");
form.append("ornament", "halo");
form.append("skin", skinFile);
form.append("backgroundImage", backgroundFile);

const response = await fetch("${siteUrl}/api/render", {
  method: "POST",
  body: form
});`;
</script>

<svelte:head>
    <title>AniMc API</title>
    <meta
        name="description"
        content="AniMc API docs for Minecraft PNG and mascot GIF rendering with uploads, transparent backgrounds, frames, ornaments, capes, items, and pose controls."
    />
</svelte:head>

<div class="api-page">
    <section class="hero">
        <div class="hero-copy">
            <p class="eyebrow">AniMc API</p>
            <h1>Minecraft renders for bots, apps, and command integrations.</h1>
            <p class="lede">
                Use AniMc as a public image backend for Discord bots, websites, dashboards,
                slash commands, and automations. Username renders work over simple GET URLs,
                and upload renders work through a single POST endpoint with public CORS.
            </p>
        </div>

        <div class="hero-panel">
            <div class="status-pill">Public CORS</div>
            <div class="status-pill alt">Mascot GIF Only</div>
            <div class="preview-shell">
                <span class="tiny-label">Quick Start</span>
                <code>{siteUrl}/api/render/devrock14.png?style=mascot&frame=pixel</code>
            </div>
        </div>
    </section>

    <section class="endpoint-grid">
        {#each endpoints as endpoint}
            <article class="card endpoint-card">
                <div class="endpoint-head">
                    <span class="method">{endpoint.method}</span>
                    <h2>{endpoint.title}</h2>
                </div>
                <code>{endpoint.path}</code>
                <p>{endpoint.note}</p>
            </article>
        {/each}
    </section>

    <section class="notice card">
        <div class="section-heading">Important</div>
        <p>
            GIF output is mascot-only now. If you call
            <code>/api/render/[username].gif?style=classic</code>, the API returns a `400`
            so classic renders stay clean as PNGs instead of fake animated loops.
        </p>
    </section>

    <section class="split">
        <article class="card">
            <div class="section-heading">Parameters</div>
            <div class="param-groups">
                {#each paramGroups as group}
                    <div class="param-group">
                        <div class="group-title">{group.title}</div>
                        {#each group.items as item}
                            <div class="param-row">
                                <span class="param-name">{item[0]}</span>
                                <span class="param-value">{item[1]}</span>
                            </div>
                        {/each}
                    </div>
                {/each}
            </div>
        </article>

        <article class="card">
            <div class="section-heading">Roadmap Status</div>
            <div class="roadmap-list">
                {#each roadmap as row}
                    <div class="roadmap-row">
                        <span>{row[0]}</span>
                        <span class:partial={row[1] === "Partial"} class="badge">{row[1]}</span>
                    </div>
                {/each}
            </div>
        </article>
    </section>

    <section class="card">
        <div class="section-heading">Examples</div>
        <div class="snippet-list">
            {#each examples as example}
                <a class="snippet-link" href={example.url} target="_blank" rel="noreferrer">
                    <span class="snippet-label">{example.label}</span>
                    <code>{example.url}</code>
                </a>
            {/each}
        </div>
    </section>

    <section class="split code-grid">
        <article class="card">
            <div class="section-heading">Discord Bot Example</div>
            <pre><code>{botExample}</code></pre>
        </article>

        <article class="card">
            <div class="section-heading">Upload Example</div>
            <pre><code>{uploadExample}</code></pre>
        </article>
    </section>
</div>

<style lang="scss">
    .api-page {
        width: min(1120px, calc(100% - 2.6rem));
        margin: 0 auto;
        padding: 4.5rem 0 6rem;
        display: flex;
        flex-direction: column;
        gap: 1.8rem;
    }

    .hero {
        display: grid;
        grid-template-columns: minmax(0, 1.35fr) minmax(28rem, 0.85fr);
        gap: 1.6rem;
        align-items: stretch;

        @media (max-width: 860px) {
            grid-template-columns: 1fr;
        }
    }

    .hero-copy,
    .hero-panel,
    .card {
        background:
            radial-gradient(circle at top right, rgba(53, 208, 255, 0.12), transparent 42%),
            linear-gradient(180deg, rgba(11, 23, 40, 0.92), rgba(9, 20, 36, 0.84));
        border: 1px solid var(--glass-border);
        border-radius: 28px;
        box-shadow: var(--shadow-soft);
    }

    .hero-copy {
        padding: 2.6rem;

        h1 {
            margin: 0;
            font-size: clamp(3.4rem, 5vw, 5.8rem);
            line-height: 0.94;
            letter-spacing: -0.05em;
            max-width: 11ch;
        }
    }

    .hero-panel {
        padding: 2.2rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        justify-content: flex-end;
    }

    .eyebrow {
        margin: 0 0 1rem;
        color: var(--accent-color);
        text-transform: uppercase;
        letter-spacing: 0.18em;
        font-size: 1.15rem;
        font-weight: 700;
    }

    .lede {
        margin: 1.4rem 0 0;
        color: var(--text-muted);
        line-height: 1.7;
        font-size: 1.62rem;
        max-width: 54rem;
    }

    .status-pill {
        display: inline-flex;
        width: fit-content;
        padding: 0.75rem 1.1rem;
        border-radius: 999px;
        font-size: 1.15rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        background: rgba(255, 122, 24, 0.16);
        color: #ffe8d1;
    }

    .status-pill.alt {
        background: rgba(53, 208, 255, 0.14);
        color: #dff9ff;
    }

    .preview-shell {
        margin-top: auto;
        padding: 1.4rem;
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.07);
        display: flex;
        flex-direction: column;
        gap: 0.7rem;
    }

    .tiny-label,
    .section-heading,
    .group-title {
        text-transform: uppercase;
        letter-spacing: 0.12em;
        font-weight: 700;
        color: var(--text-muted);
    }

    .tiny-label {
        font-size: 1.05rem;
    }

    .section-heading {
        font-size: 1.2rem;
        margin-bottom: 1.2rem;
    }

    .endpoint-grid,
    .split,
    .code-grid {
        display: grid;
        gap: 1.4rem;
    }

    .endpoint-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));

        @media (max-width: 860px) {
            grid-template-columns: 1fr;
        }
    }

    .split,
    .code-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));

        @media (max-width: 920px) {
            grid-template-columns: 1fr;
        }
    }

    .card {
        padding: 2rem;
    }

    .endpoint-card {
        display: flex;
        flex-direction: column;
        gap: 0.9rem;

        h2,
        p {
            margin: 0;
        }

        p {
            color: var(--text-muted);
            line-height: 1.6;
        }
    }

    .endpoint-head {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .method,
    .badge {
        border-radius: 999px;
        padding: 0.45rem 0.9rem;
        font-size: 1.05rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
    }

    .method {
        background: rgba(53, 208, 255, 0.14);
        color: #dff9ff;
    }

    .notice p {
        margin: 0;
        color: var(--text-muted);
        line-height: 1.7;
    }

    .param-groups,
    .roadmap-list,
    .snippet-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .param-group {
        display: flex;
        flex-direction: column;
        gap: 0.7rem;
        padding: 1rem 1.1rem;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.04);
    }

    .group-title {
        font-size: 1.05rem;
    }

    .param-row,
    .roadmap-row {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: center;
    }

    .param-row {
        padding-top: 0.2rem;
        border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .param-name {
        font-weight: 700;
        color: var(--text-main);
    }

    .param-value {
        color: var(--text-muted);
        text-align: right;
    }

    .roadmap-row {
        padding: 1rem 1.1rem;
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.04);
        color: var(--text-main);
    }

    .badge {
        background: rgba(255, 122, 24, 0.16);
        color: #ffe8d1;
    }

    .badge.partial {
        background: rgba(255, 208, 90, 0.14);
        color: #ffe9ab;
    }

    .snippet-link {
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
        text-decoration: none;
        padding: 1rem 1.15rem;
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.06);
        transition:
            transform 0.25s ease,
            border-color 0.25s ease,
            background 0.25s ease;

        &:hover {
            transform: translateY(-1px);
            border-color: rgba(53, 208, 255, 0.24);
            background: rgba(53, 208, 255, 0.05);
        }
    }

    .snippet-label {
        color: var(--text-main);
        font-weight: 700;
    }

    code,
    pre {
        font-family: "JetBrains Mono", "Fira Code", monospace;
    }

    code {
        color: #dff6ff;
        font-size: 1.26rem;
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
