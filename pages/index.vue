<!--

Webapp nicely styled in Hubexo's branding :)

-->

<template>
    <main class="page">
        <div class="card">
            <div class="card__header">
                <h1 class="card__title">Hubexo URL Shortener</h1>

                <link-icon />
            </div>

            <shorten-form
                @success="onSuccess"
                @error="onError"
            />

            <result v-if="result" :result="result" />

            <form-error v-if="error">
                {{ error }}
            </form-error>
        </div>
    </main>
</template>

<script lang="ts">
import type { ShortenResult } from '~/types/shorten';
import { ShortenForm, Result, FormError } from "#components";
import LinkIcon from "~/components/link-icon.vue";

export default defineNuxtComponent({
    name: "index",
    components: {LinkIcon, ShortenForm, Result, FormError },

    data() {
        return {
            result: null as ShortenResult | null,
            error: '' as string,
            timeout: 12000 as number
        }
    },

    methods: {
        onSuccess(result: ShortenResult) {
            this.error = '';
            this.result = result;
            setTimeout(() => { this.result = null; }, this.timeout);
        },

        onError(message: string) {
            this.result = null;
            this.error = message;
            setTimeout(() => { this.error = ''; }, this.timeout);
        }
    }
});
</script>

<style scoped lang="scss">
@use '/assets/scss/base/util';
@use '/assets/scss/base/vars' as *;

.page {
    width: 100%;
    display: flex;
    justify-content: center;
    padding: util.px2rem(32) util.px2rem(16);
}

.card {
    background: $colour-white;
    padding: util.px2rem(24);
    width: 100%;
    max-width: util.px2rem(560);
    display: flex;
    flex-direction: column;
    gap: util.px2rem(30);

    &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: util.px2rem(100)
    }

    &__title {
        font-size: util.px2rem(30);
        font-weight: 400;
        color: $colour-plum;
    }
}
</style>
