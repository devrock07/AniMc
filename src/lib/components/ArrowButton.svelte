<script lang="ts">
    type Orientation = "left" | "right";
    export let orientation: Orientation = "left";
    const pointChar = orientation === "left" ? "<" : ">";

    // Sets the way the button moves on hover, tad odd I know
    const hoverTransform = `--hoverTransform: calc(0rem ${pointChar === ">" ? "+" : "-"} 7.5rem / 8);`;
    const baseTransform = `--baseTransform: calc(0rem ${pointChar === ">" ? "-" : "+"} 7.5rem / 8);`;
    const styling = hoverTransform + baseTransform;
</script>

<button on:click style={styling}>
    <p style="margin-left:{pointChar === '>' ? '1rem' : '0'};">
        {pointChar}
    </p>
    <slot />
</button>

<style lang="scss">
    button {
        transform: translateX(calc(var(--hoverTransform) * -1));

        width: 6rem;
        height: 6rem;

        background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.04));
        border: 1px solid var(--glass-border);
        box-shadow: 0 14px 28px rgba(0, 0, 0, 0.2);

        border-radius: 50%;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;

        p {
            font-size: 3rem;
            color: var(--text-main);
            font-family: var(--font-main);
            margin: 0;
            line-height: 1;
        }

        &:hover {
            transform: translateX(var(--hoverTransform));
            cursor: pointer;
            background: linear-gradient(135deg, var(--primary), var(--primary-strong));
            border-color: rgba(255, 255, 255, 0.12);
            box-shadow: 0 16px 30px rgba(255, 122, 24, 0.26);
            
            p {
                color: white;
            }
        }
    }

    @media only screen and (max-width: 810px) {
        button {
            width: 5rem;
            height: 5rem;
            margin: 0 1rem;

            p {
                font-size: 2.5rem;
            }

            &:hover {
                transform: none;
            }
        }
    }
</style>
