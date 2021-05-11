<template>
  <div
    class="
      flex
      items-center
      justify-center
      flex-col md:flex-row
      space-x-4
    "
  >
    <figure class="w-12 h-12 md:w-16 md:h-16">
      <slot name="image" />
    </figure>
    <h2 class="text-xl md:text-3xl font-semibold">
      <slot />
    </h2>
  </div>
</template>
