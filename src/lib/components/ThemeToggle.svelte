<script>
    // @ts-ignore
    import { onMount } from "svelte";

    function applyStored() {
        const stored = localStorage.getItem("theme") ?? "dark";

        if (stored === "dark") {
            window.document.body.classList.remove("dark-mode");
        } else {
            window.document.body.classList.add("dark-mode");
        }
    }

    function toggle() {
        const stored = localStorage.getItem("theme") ?? "dark";

        localStorage.setItem("theme", stored === "dark" ? "light" : "dark");

        window.document.body.classList.toggle("dark-mode");
    }

    onMount(() => applyStored());
</script>

<button on:click={toggle}>
    <div class="icon sun">☀️</div>
    <div class="icon moon">🌙</div>
    <slot />
</button>

<style lang="scss">
    button {
        background-color: transparent;
        border: none;
        cursor: pointer;

        height: 6rem;
        width: 6rem;
        .moon {
            display: none;
        }

        .sun {
            display: block;
        }
    }

    :global(body.dark-mode) button {
        .sun {
            display: none;
        }

        .moon {
            display: block;
        }
    }

    @media only screen and (max-width: 768px) {
        button {
            height: 4rem;
            width: 4rem;
        }
    }
</style>
