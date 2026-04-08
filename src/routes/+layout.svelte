<script lang="ts">
    import "../app.css";
    import MusicPlayer from "$lib/components/MusicPlayer.svelte";
    import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';

    injectSpeedInsights();

    function copyAddress(bg: string, type: string) {
        navigator.clipboard.writeText(bg);
        alert(`Copied ${type} address to clipboard!`);
    }
</script>

<nav id="navBar">
    <div class="nav-content">
        <a href="/" class="logo">
            <img src="/PFP/Makima.png" alt="AniMc Logo" />
            <h1>AniMc</h1>
        </a>
        <div class="nav-links">
            <a href="/generate" class="cta-button">Create PFP</a>
        </div>
    </div>
</nav>

<main>
    <slot />
</main>

<MusicPlayer />

<footer id="footer">
    <div class="footer-content">
        <p>&copy; 2025 AniMc. All rights reserved.</p>
        <div class="footer-links">
            <a
                href="https://github.com/devrock07/AniMc"
                target="_blank"
                rel="noopener noreferrer">GitHub</a
            >
            <div class="donation-group">
                <span>Donate:</span>
                <button
                    on:click={() =>
                        copyAddress(
                            "LcPnFkTa5UTav5Ue3dM6GdLh7LpTm47JZx",
                            "LTC",
                        )}>LTC</button
                >
                <button
                    on:click={() =>
                        copyAddress(
                            "bc1qdumjz2sex6uykuffnlrxwr6qlj27euvaee7rl8",
                            "BTC",
                        )}>BTC</button
                >
            </div>
        </div>
    </div>
</footer>

<style lang="scss">
    :global(:root) {
        --bg-main: #07111f;
        --bg-secondary: #0d1a2d;
        --bg-elevated: rgba(12, 25, 43, 0.78);
        --primary: #ff7a18;
        --primary-strong: #ff9f4a;
        --primary-hover: #ff8d2f;
        --accent-color: #35d0ff;
        --accent-soft: rgba(53, 208, 255, 0.16);
        --text-main: #f7f3ea;
        --text-muted: #a8b4c8;
        --glass: rgba(255, 255, 255, 0.07);
        --glass-border: rgba(255, 255, 255, 0.14);
        --shadow-soft: 0 18px 60px rgba(0, 0, 0, 0.32);
        --shadow-glow: 0 16px 40px rgba(255, 122, 24, 0.22);
        --font-main: "Outfit", sans-serif;
    }

    :global(html) {
        font-size: 62.5%; /* 1rem = 10px */
        scroll-behavior: smooth;
    }

    :global(body) {
        margin: 0;
        padding: 0;
        background:
            radial-gradient(circle at top left, rgba(53, 208, 255, 0.18), transparent 32%),
            radial-gradient(circle at 80% 20%, rgba(255, 122, 24, 0.2), transparent 30%),
            linear-gradient(180deg, #08111f 0%, #0b1424 45%, #07101d 100%);
        color: var(--text-main);
        font-family: var(--font-main);
        overflow-x: hidden;
        min-height: 100vh;
        /* Custom Scrollbar */
        &::-webkit-scrollbar {
            width: 8px;
        }
        &::-webkit-scrollbar-track {
            background: var(--bg-main);
        }
        &::-webkit-scrollbar-thumb {
            background: var(--primary);
            border-radius: 4px;
        }
    }

    :global(*) {
        box-sizing: border-box;
    }

    :global(body::before) {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        background:
            linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
        background-size: 48px 48px;
        mask-image: radial-gradient(circle at center, black, transparent 82%);
        opacity: 0.7;
        z-index: -1;
    }

    :global(a) {
        color: inherit;
    }

    :global(button),
    :global(input) {
        font: inherit;
    }

    :global(button:focus-visible),
    :global(a:focus-visible),
    :global(input:focus-visible) {
        outline: 2px solid rgba(53, 208, 255, 0.7);
        outline-offset: 3px;
    }

    main {
        min-height: calc(100vh - 80px - 60px);
        padding-top: 80px;
    }

    /* Navigation */
    #navBar {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 80px;
        z-index: 1000;
        backdrop-filter: blur(12px);
        background: rgba(7, 17, 31, 0.72);
        border-bottom: 1px solid var(--glass-border);
        box-shadow: 0 6px 30px rgba(0, 0, 0, 0.18);

        .nav-content {
            max-width: 1200px;
            margin: 0 auto;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 2rem;
        }

        .logo {
            display: flex;
            align-items: center;
            text-decoration: none;
            gap: 1.5rem;

            img {
                height: 48px;
                border-radius: 12px;
                box-shadow: 0 0 24px rgba(53, 208, 255, 0.18);
                transition:
                    transform 0.3s ease,
                    box-shadow 0.3s ease;
            }

            h1 {
                font-size: 2.4rem;
                font-weight: 700;
                color: var(--text-main);
                margin: 0;
                letter-spacing: -0.02em;
            }

            &:hover img {
                transform: scale(1.04) rotate(3deg);
                box-shadow: 0 0 28px rgba(255, 122, 24, 0.28);
            }
        }

        .cta-button {
            background: linear-gradient(135deg, var(--primary), var(--primary-strong));
            color: #fff7ed;
            padding: 1rem 2.3rem;
            border-radius: 50px;
            text-decoration: none;
            font-size: 1.6rem;
            font-weight: 600;
            transition:
                transform 0.3s ease,
                box-shadow 0.3s ease,
                filter 0.3s ease;
            box-shadow: var(--shadow-glow);

            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 20px 36px rgba(255, 122, 24, 0.28);
                filter: saturate(1.08);
            }
        }

        @media (max-width: 640px) {
            height: 72px;

            .nav-content {
                padding: 0 1.4rem;
            }

            .logo {
                gap: 1rem;

                img {
                    height: 40px;
                }

                h1 {
                    font-size: 2rem;
                }
            }

            .cta-button {
                padding: 0.9rem 1.6rem;
                font-size: 1.4rem;
            }
        }
    }

    /* Footer */
    #footer {
        background: rgba(7, 17, 31, 0.8);
        border-top: 1px solid var(--glass-border);
        padding: 3rem 0;
        margin-top: auto;

        .footer-content {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 2rem;

            p {
                font-size: 1.4rem;
                color: var(--text-muted);
                margin: 0;
            }
        }

        .footer-links {
            display: flex;
            gap: 2rem;
            align-items: center;

            a {
                color: var(--text-muted);
                text-decoration: none;
                font-size: 1.4rem;
                transition:
                    color 0.3s ease,
                    opacity 0.3s ease;

                &:hover {
                    color: var(--accent-color);
                }
            }
        }

        .donation-group {
            display: flex;
            gap: 1rem;
            align-items: center;
            margin-left: 2rem;
            padding-left: 2rem;
            border-left: 1px solid var(--glass-border);

            span {
                font-size: 1.4rem;
                color: var(--text-muted);
            }

            button {
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid var(--glass-border);
                color: var(--text-main);
                padding: 0.55rem 1rem;
                border-radius: 999px;
                cursor: pointer;
                font-size: 1.2rem;
                font-family: var(--font-main);
                transition:
                    background 0.2s ease,
                    border-color 0.2s ease,
                    transform 0.2s ease;

                &:hover {
                    background: var(--accent-soft);
                    border-color: rgba(53, 208, 255, 0.4);
                    color: white;
                    transform: translateY(-1px);
                }
            }
        }

        @media (max-width: 768px) {
            .footer-content {
                flex-direction: column;
                gap: 2rem;
                text-align: center;
            }

            .donation-group {
                margin: 0;
                padding: 0;
                border: none;
                flex-wrap: wrap;
                justify-content: center;
            }
        }
    }
</style>
