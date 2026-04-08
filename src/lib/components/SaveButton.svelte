<script lang="ts">
    export let text = "save";
</script>

<button on:click>
    <p>{text}</p>
    <slot />
</button>

<style lang="scss">
    button {
        width: 14rem;
        height: 5.5rem;
        background: linear-gradient(135deg, var(--primary), var(--primary-strong));
        color: #fff7ed;
        border: none;
        border-radius: 999px;
        transition:
            transform 0.3s ease,
            box-shadow 0.3s ease,
            filter 0.3s ease;
        box-shadow: 0 16px 30px rgba(255, 122, 24, 0.24);

        p {
            font-size: 1.8rem;
            font-weight: 600;
            color: inherit;
            font-family: var(--font-main);
            margin: 0;
        }

        &:hover {
            transform: translateY(-0.3rem);
            cursor: pointer;
            box-shadow: 0 18px 34px rgba(255, 122, 24, 0.32);
            filter: saturate(1.08);
        }
    }

    @media only screen and (max-width: 810px) {
        button {
            width: 12rem;
            height: 4.5rem;

            p {
                font-size: 1.6rem;
            }
        }
    }
</style>
