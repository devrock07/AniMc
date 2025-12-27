<script lang="ts">
    import { onMount } from "svelte";
    import SEO from "$lib/components/SEO.svelte";

    const names = ["Showcase3", "Showcase4", "Makima"];
    const name = names[Math.floor(Math.random() * names.length)];
</script>

<SEO 
    title="AniMc - Free Minecraft Profile Picture Generator | Create Custom PFPs"
    description="Create stunning Minecraft profile pictures for free! Generate custom PFPs with gradients, effects, and your Minecraft skin. Perfect for Discord, social media, and gaming profiles."
    url="https://ani-mc.vercel.app"
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
        padding: 4rem 2rem;
        min-height: 80vh;
        gap: 4rem;

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

        .title {
            font-size: 6rem;
            line-height: 1.1;
            font-weight: 700;
            margin-bottom: 2rem;
            display: flex;
            flex-direction: column;

            @media (max-width: 600px) {
                font-size: 3.6rem;
            }

            .highlight {
                color: transparent;
                background: linear-gradient(
                    90deg,
                    var(--primary),
                    var(--accent-color)
                );
                -webkit-background-clip: text;
                background-clip: text;
            }
        }

        .subtitle {
            font-size: 1.8rem;
            color: var(--text-muted);
            margin-bottom: 4rem;
            line-height: 1.6;
        }

        .cta-group {
            display: flex;
            gap: 2rem;
            flex-wrap: wrap;

            @media (max-width: 900px) {
                justify-content: center;
            }
        }
    }

    .btn-primary,
    .btn-secondary {
        padding: 1.5rem 3rem;
        border-radius: 12px;
        font-size: 1.6rem;
        font-weight: 600;
        text-decoration: none;
        transition: all 0.3s ease;
    }

    .btn-primary {
        background: var(--primary);
        color: white;
        box-shadow: 0 4px 20px rgba(118, 74, 241, 0.4);

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 25px rgba(118, 74, 241, 0.6);
        }
    }

    .btn-secondary {
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-main);
        border: 1px solid var(--glass-border);

        &:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: var(--primary);
        }
    }

    .showcase {
        flex: 1;
        position: relative;
        height: 500px;
        width: 100%;
        max-width: 500px;

        .card {
            position: absolute;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
            transition: all 0.5s ease;

            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
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
                box-shadow: 0 10px 20px rgba(0,0,0,0.3);
                flex-shrink: 0;
            }

            .card-1 {
                order: 2; /* Center */
                top: 0; right: 0; left: 0; /* Reset */
                z-index: 10;
                transform: scale(1.15) translateY(-10px);
                box-shadow: 0 15px 30px rgba(118, 74, 241, 0.4); /* Glow */
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
