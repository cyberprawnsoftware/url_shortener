<template>
    <div class="result">
        <p class="result__message">{{ result.message }}</p>
        <div class="result__link">
            <a :href="result.short" target="_blank">{{ result.short }}</a>
        </div>
        <p v-if="result.expiresAt" class="result__expiry">
            Expires {{ expiryLabel }}
        </p>
    </div>
</template>

<script lang="ts">
import type { ShortenResult } from '~/types/shorten';

export default defineNuxtComponent({
    name: "result",

    props: {
        result: {
            type: Object as () => ShortenResult,
            required: true
        }
    },

    data() {
        return {
            copied: false
        }
    },

    computed: {
        expiryLabel(): string {
            if (!this.result.expiresAt) return '';
            return new Date(this.result.expiresAt).toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
    },
});
</script>

<style scoped lang="scss">
@use '/assets/scss/base/util';
@use '/assets/scss/base/vars' as *;

.result {
    display: flex;
    flex-direction: column;
    gap: util.px2rem(10);
    padding: util.px2rem(14);
    background: $colour-light-grey;
    border: 1px solid $colour-charcoal;

    &__message {
        font-size: util.px2rem(14);
        color: $colour-charcoal;
        font-weight: 500;
    }

    &__link {
        display: flex;
        align-items: center;
        gap: util.px2rem(10);

        a {
            font-size: util.px2rem(16);
            color: $colour-plum;
            text-decoration: none;
            font-weight: 600;
            word-break: break-all;

            &:hover {
                text-decoration: underline;
            }
        }
    }
}
</style>
