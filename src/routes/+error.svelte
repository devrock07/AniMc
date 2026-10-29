<script lang="ts">
    import { page } from "$app/stores";

    $: notFound = $page.status === 404;
</script>

<svelte:head>
    <title>{$page.status} | AniMc</title>
</svelte:head>

<div id="wrapper">
    <h1>{notFound ? "404 — unsure how you got here" : `${$page.status} — something went wrong`}</h1>
    {#if !notFound && $page.error?.message}
        <p>{$page.error.message}</p>
    {/if}
    <a href="/">return to homepage ↩</a>
</div>

<style lang="scss">
    #wrapper {
        min-height: calc(100vh - 9rem - 5rem);
        width: 100%;
        padding: 0 1rem;
        box-sizing: border-box;
        gap: 1rem;
        text-align: center;

        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;

        h1 {
            color: #ff5555;
            font-size: clamp(1.5rem, 3vw, 3rem);
            margin: 0;
        }

        p {
            margin: 0;
            opacity: 0.8;
        }

        a {
            color: #da4167;
            font-size: clamp(1rem, 2vw, 2rem);
        }
    }
</style>
