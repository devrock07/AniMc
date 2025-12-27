<script lang="ts">
    export let title = "AniMc - Free Minecraft Profile Picture Generator | Custom PFP Maker";
    export let description = "Create stunning Minecraft profile pictures for free! Generate custom PFPs with gradients, effects, and your Minecraft skin. Perfect for Discord, social media, and gaming profiles.";
    export let username = "I_Like_Cats__";
    export let url = "https://ani-mc.vercel.app";
    const imgURL = `https://ani-mc.vercel.app/api/pfp/${username}.png`;
</script>

<svelte:head>
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:standard" />
    <meta name="keywords" content="minecraft,minecraft profile picture,free minecraft profile picture,fiverr minecraft profile picture,free fiverr minecraft profile picture,profile picture,free profile picture,mc profile picture,free mc profile picture,mc pfp,free mc pfp,minecraft pfp,free minecraft pfp,no watermark,watermark free," />
    
    <!-- Canonical URL -->
    <link rel="canonical" href={url} />
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content={url} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:image" content={imgURL} />
    
    <!-- Twitter / X -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content={url} />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={imgURL} />
</svelte:head>
