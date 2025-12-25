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

        background: var(--primary);
        filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3));

        border: none;
        border-radius: 12px;
        transition: all 0.3s ease;

        p {
            font-size: 2rem;
            font-weight: 600;
            color: #ffffff;
            font-family: var(--font-main);
            margin: 0;
        }

        &:hover {
            transform: translateY(-0.3rem);
            cursor: pointer;
            background: var(--primary-hover);
            box-shadow: 0 6px 15px rgba(118, 74, 241, 0.4);
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
