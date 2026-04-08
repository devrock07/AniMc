<script lang="ts">
    import SEO from "$lib/components/SEO.svelte";

    const names = ["Showcase3", "Showcase4", "Makima"];
    const name = names[Math.floor(Math.random() * names.length)];
</script>

<SEO 
    title="AniMc - Free Minecraft Profile Picture Generator | Create Custom PFPs"
    description="Create stunning Minecraft profile pictures for free! Generate custom PFPs with gradients, effects, and your Minecraft skin. Perfect for Discord, social media, and gaming profiles."
    url="https://animc.d4vrock.xyz"
/>

<div class="hero">
    <div class="hero-content">
        <h1 class="title">
            <span>Create your unique</span>
            <span class="highlight">Minecraft PFP</span>
        </h1>
        <p class="subtitle">
            Stop paying for basic art. Generate high-quality, 3D-rendered
            profile pictures in seconds.
        </p>

        <div class="cta-group">
            <a href="/generate" class="btn-primary">
                <span>Start Generating</span>
            </a>
            <a
                href="https://github.com/devrock07/AniMc"
                target="_blank"
                class="btn-secondary">View on GitHub</a
            >
        </div>
    </div>

    <div class="showcase">
        <div class="card card-1">
            <img src="/PFP/Showcase1.png" alt="Example 1" />
        </div>
        <div class="card card-2">
            <img src="/PFP/Showcase2.png" alt="Example 2" />
        </div>
        <div class="card card-3">
            <img src="/PFP/{name}.png" alt="Example 3" />
        </div>
    </div>
</div>

<style lang="scss">
    .hero {
        display: flex;
        align-items: center;
        justify-content: space-between;
        max-width: 1200px;
        margin: 0 auto;
        padding: 5rem 2rem 6rem;
        min-height: 80vh;
        gap: 4rem;
        position: relative;

        @media (max-width: 900px) {
            flex-direction: column;
            text-align: center;
            padding-top: 8rem;
        }

        @media (max-width: 600px) {
            padding: 2rem 1rem;
            padding-top: 6rem;
        }
    }

    .hero-content {
        flex: 1;
        max-width: 600px;
        width: 100%;
        position: relative;
        z-index: 1;

        .title {
            font-size: clamp(4.8rem, 8vw, 7.2rem);
            line-height: 0.98;
            font-weight: 800;
            letter-spacing: -0.05em;
            margin: 0 0 2.2rem;
            display: flex;
            flex-direction: column;

            @media (max-width: 600px) {
                font-size: 4.2rem;
            }

            .highlight {
                color: transparent;
                background: linear-gradient(
                    135deg,
                    var(--primary),
                    var(--accent-color)
                );
                -webkit-background-clip: text;
                background-clip: text;
                filter: drop-shadow(0 10px 30px rgba(255, 122, 24, 0.18));
            }
        }

        .subtitle {
            font-size: 1.9rem;
            color: var(--text-muted);
            margin: 0 0 3.4rem;
            line-height: 1.7;
            max-width: 54rem;

            @media (max-width: 900px) {
                margin-inline: auto;
            }
        }

        .cta-group {
            display: flex;
            gap: 1.4rem;
            flex-wrap: wrap;

            @media (max-width: 900px) {
                justify-content: center;
            }
        }
    }

    .btn-primary,
    .btn-secondary {
        padding: 1.45rem 2.5rem;
        border-radius: 999px;
        font-size: 1.6rem;
        font-weight: 600;
        text-decoration: none;
        transition:
            transform 0.3s ease,
            box-shadow 0.3s ease,
            background 0.3s ease,
            border-color 0.3s ease;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .btn-primary {
        background: linear-gradient(135deg, var(--primary), var(--primary-strong));
        color: #fff7ed;
        box-shadow: 0 18px 36px rgba(255, 122, 24, 0.24);

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 20px 44px rgba(255, 122, 24, 0.34);
        }
    }

    .btn-secondary {
        background: rgba(255, 255, 255, 0.06);
        color: var(--text-main);
        border: 1px solid var(--glass-border);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);

        &:hover {
            background: rgba(53, 208, 255, 0.08);
            border-color: rgba(53, 208, 255, 0.36);
            transform: translateY(-2px);
        }
    }

    .showcase {
        flex: 1;
        position: relative;
        height: 500px;
        width: 100%;
        max-width: 500px;
        isolation: isolate;

        &::before {
            content: "";
            position: absolute;
            inset: 14% 12%;
            background: radial-gradient(circle, rgba(53, 208, 255, 0.18), transparent 65%);
            filter: blur(24px);
            z-index: 0;
        }

        .card {
            position: absolute;
            border-radius: 28px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.14);
            background: rgba(255, 255, 255, 0.04);
            box-shadow: 0 24px 48px rgba(0, 0, 0, 0.35);
            transition:
                transform 0.5s ease,
                box-shadow 0.5s ease;

            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            }

            &:hover {
                box-shadow: 0 28px 54px rgba(0, 0, 0, 0.42);
            }
        }

        .card-1 {
            width: 300px;
            height: 300px;
            top: 0;
            right: 0;
            z-index: 1;
            animation: float 6s ease-in-out infinite;
        }

        .card-2 {
            width: 250px;
            height: 250px;
            top: 200px;
            right: 150px;
            z-index: 2;
            animation: float 6s ease-in-out infinite 2s;
        }

        .card-3 {
            width: 200px;
            height: 200px;
            top: 100px;
            left: 0;
            z-index: 3;
            animation: float 6s ease-in-out infinite 1s;
        }

        @media (max-width: 900px) {
            height: 400px;

            .card-1 {
                width: 200px;
                height: 200px;
                right: 50px;
            }
            .card-2 {
                width: 160px;
                height: 160px;
                right: 150px;
                top: 150px;
            }
            .card-3 {
                width: 140px;
                height: 140px;
                left: 50px;
                top: 80px;
            }
        }

        @media (max-width: 600px) {
            height: auto;
            min-height: 250px;
            margin-top: 3rem;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0; /* Overlap handled by margins/transforms */
            padding-bottom: 2rem;

            .card {
                position: relative; /* relative for flex flow */
                width: 130px;
                height: 130px;
                box-shadow: 0 14px 28px rgba(0, 0, 0, 0.3);
                flex-shrink: 0;
            }

            .card-1 {
                order: 2; /* Center */
                top: 0; right: 0; left: 0; /* Reset */
                z-index: 10;
                transform: scale(1.15) translateY(-10px);
                box-shadow: 0 18px 36px rgba(255, 122, 24, 0.3); /* Glow */
                border: 2px solid rgba(255, 255, 255, 0.2);
            }

            .card-2 {
                order: 1; /* Left */
                top: 0; right: 0; /* Reset */
                margin-right: -30px; /* Overlap */
                transform: rotate(-12deg) translateY(10px);
                filter: brightness(0.8);
                z-index: 5;
            }

            .card-3 {
                order: 3; /* Right */
                top: 0; left: 0; /* Reset */
                margin-left: -30px; /* Overlap */
                transform: rotate(12deg) translateY(10px);
                filter: brightness(0.8);
                z-index: 5;
            }
        }
    }

    @keyframes float {
        0%,
        100% {
            transform: translateY(0);
        }
        50% {
            transform: translateY(-20px);
        }
    }
</style>
