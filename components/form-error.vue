<template>
    <div class="form-error">
        <slot />
    </div>
</template>

<script lang="ts">
export default defineNuxtComponent({
    name: "form-error"
});
</script>

<style scoped lang="scss">
@use '/assets/scss/base/util';
@use '/assets/scss/base/vars' as *;

.form-error {
    padding: util.px2rem(14) util.px2rem(16);
    font-size: util.px2rem(14);
    font-weight: 500;
    color:  $colour-red;
    background: $colour-light-red;
    border: 1px solid  $colour-red;
}
</style>
