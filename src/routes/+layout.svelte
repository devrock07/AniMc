<script lang="ts">
    import "../app.css";
    import MusicPlayer from "$lib/components/MusicPlayer.svelte";

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
        --bg-main: #0a0a0a;
        --bg-secondary: #121212;
        --primary: #764af1;
        --primary-hover: #5e35d8;
        --text-main: #f3f4f6;
        --text-muted: #9ca3af;
        --glass: rgba(255, 255, 255, 0.05);
        --glass-border: rgba(255, 255, 255, 0.1);
        --font-main: "Outfit", sans-serif;
    }

    :global(html) {
        font-size: 62.5%; /* 1rem = 10px */
        scroll-behavior: smooth;
    }

    :global(body) {
        margin: 0;
        padding: 0;
        background-color: var(--bg-main);
        color: var(--text-main);
        font-family: var(--font-main);
        overflow-x: hidden;
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

    main {
        min-height: calc(100vh - 80px - 60px); /* Nav height - Footer height */
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
        background: rgba(10, 10, 10, 0.8);
        border-bottom: 1px solid var(--glass-border);

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
                box-shadow: 0 0 15px rgba(118, 74, 241, 0.3);
                transition: transform 0.3s ease;
            }

            h1 {
                font-size: 2.4rem;
                font-weight: 700;
                color: var(--text-main);
                margin: 0;
                letter-spacing: -0.02em;
            }

            &:hover img {
                transform: scale(1.05) rotate(5deg);
            }
        }

        .cta-button {
            background: var(--primary);
            color: white;
            padding: 1rem 2.5rem;
            border-radius: 50px;
            text-decoration: none;
            font-size: 1.6rem;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(118, 74, 241, 0.4);

            &:hover {
                background: var(--primary-hover);
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(118, 74, 241, 0.6);
            }
        }
    }

    /* Footer */
    #footer {
        background: var(--bg-secondary);
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
                transition: color 0.3s ease;

                &:hover {
                    color: var(--primary);
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
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid var(--glass-border);
                color: var(--text-main);
                padding: 0.4rem 1rem;
                border-radius: 6px;
                cursor: pointer;
                font-size: 1.2rem;
                font-family: var(--font-main);
                transition: all 0.2s ease;

                &:hover {
                    background: var(--primary);
                    border-color: var(--primary);
                    color: white;
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
