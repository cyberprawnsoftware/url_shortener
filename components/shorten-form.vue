<template>
    <form
        @submit.prevent="submitForm"
        ref="form"
        novalidate
        class="shorten-form"
    >
        <div class="shorten-form__field" :class="{ 'shorten-form__field--error': fieldErrors.url }">
            <label class="shorten-form__label" for="url">URL</label>
            <input
                v-on:input="fieldChanged($event)"
                v-on:change="fieldChanged($event)"
                type="text"
                placeholder="https://example.com"
                name="url"
                id="url"
                class="shorten-form__input"
            />
            <span v-if="fieldErrors.url" class="shorten-form__field-error">
                {{ fieldErrors.url }}
            </span>
        </div>

        <div class="shorten-form__field" :class="{ 'shorten-form__field--error': fieldErrors.expiresIn }">
            <label class="shorten-form__label" for="expiresIn">Expiry (days)</label>
            <input
                v-on:input="fieldChanged($event)"
                v-on:change="fieldChanged($event)"
                type="number"
                placeholder="Never"
                name="expiresIn"
                id="expiresIn"
                min="1"
                max="365"
                class="shorten-form__input shorten-form__input--narrow"
            />
            <span class="shorten-form__hint">Leave blank for no expiry. Maximum 365 days.</span>
            <span v-if="fieldErrors.expiresIn" class="shorten-form__field-error">
                {{ fieldErrors.expiresIn }}
            </span>
        </div>

        <button type="submit" :disabled="sending" class="shorten-form__button">
            {{ sending ? 'Shortening...' : 'Shorten' }}

            <arrow-right-icon
                v-if="!sending"
                class="shorten-form__button-icon"
            />
        </button>
    </form>
</template>

<script lang="ts">
import type { ShortenResponse, ShortenResult } from '~/types/shorten';
import ArrowRightIconIcon from "~/components/arrow-right-icon.vue";

export default defineNuxtComponent({
    name: "ShortenForm",

    components: { ArrowRightIcon: ArrowRightIconIcon },

    emits: ['success', 'error'],

    data() {
        return {
            sending: false,
            formFields: {} as Record<string, string>,
            fieldErrors: {} as Record<string, string>,
        }
    },

    methods: {
        fieldChanged(event: Event) {
            const input = event.target as HTMLInputElement;

            this.formFields[input.name] = input.value;

            if (this.fieldErrors[input.name]) {
                delete this.fieldErrors[input.name];

                this.fieldErrors = { ...this.fieldErrors };
            }
        },

        clearErrors() {
            this.fieldErrors = {};
        },

        reset() {
            const form = this.$refs.form as HTMLFormElement;

            if (form) form.reset();

            this.formFields = {};

            this.clearErrors();
        },

        createPayload() {
            const payload: { url: string; expiresIn?: number } = {
                url: this.formFields.url ?? ''
            };

            if (this.formFields.expiresIn) {
                payload.expiresIn = parseInt(this.formFields.expiresIn, 10);
            }

            return payload;
        },

        async submitForm() {
            const config = useRuntimeConfig();

            if (this.sending) return;

            this.sending = true;

            this.clearErrors();

            fetch('/api/shorten', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + config.public.API_KEY,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(this.createPayload())
            })
                .then(response => response.json())
                .then((response: ShortenResponse) => {
                    if (response.success) {
                        const result: ShortenResult = {
                            existing: response.existing ?? false,
                            slug: response.slug!,
                            short: response.short!,
                            message: response.message!,
                            expiresAt: response.expiresAt ?? null
                        };

                        this.$emit('success', result);

                        this.reset();
                    } else {
                        if (response.fields?.length) {
                            const fieldErrors: Record<string, string> = {};

                            for (const error of response.fields) {
                                fieldErrors[error.key] = error.message;
                            }
                            this.fieldErrors = fieldErrors;
                        }
                        this.$emit('error', response.errors?.[0] ?? 'Something went wrong.');
                    }
                })
                .catch(() => {
                    this.$emit('error', 'An unexpected error occurred. Please try again.');
                })
                .finally(() => {
                    this.sending = false;
                });
        }
    }
});
</script>

<style scoped lang="scss">
@use '/assets/scss/base/util';
@use '/assets/scss/base/vars' as *;

.shorten-form {
    display: flex;
    flex-direction: column;
    gap: util.px2rem(30);

    &__label {
        display: block;
        font-size: util.px2rem(14);
        font-weight: 600;
        margin-bottom: util.px2rem(6);
        color: $colour-charcoal;
    }

    &__hint {
        font-size: util.px2rem(12);
        color: rgba($colour-charcoal, 0.5);
        margin-top: util.px2rem(4);
    }

    &__field {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: util.px2rem(5);

        &--error .shorten-form__input {
            border-color: $colour-red;
        }
    }

    &__input {
        width: 100%;
        padding: util.px2rem(14) util.px2rem(16);
        font-size: $base-size + px;
        border: 1px solid rgb(50, 20, 50);
        outline: none;
        transition: border-color 0.3s;

        &:focus {
            border-color: $colour-green;
        }
    }

    &__field-error {
        font-size: util.px2rem(14);
        color: $colour-red;
    }

    &__button {
        padding: util.px2rem(16) util.px2rem(24);
        font-size: util.px2rem(18);
        font-weight: 400;
        color: $colour-charcoal;
        background: $colour-green;
        border: none;
        border-radius: util.px2rem(100);
        cursor: pointer;
        transition: background 0.3s, opacity 0.3s;
        align-self: flex-start;
        display: inline-flex;
        gap: util.px2rem(10);

        &:hover:not(:disabled) {
            color: $colour-white;
            background: $colour-plum;
        }

        &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
    }

    &__button-icon {
        align-self: center;
    }
}
</style>
