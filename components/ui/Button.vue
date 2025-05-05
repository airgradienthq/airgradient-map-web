<template>
  <button :class="buttonClasses" :disabled="disabled" @click="handleClick">
    <slot></slot>
  </button>
</template>

<script setup lang="ts">
  import { computed, PropType } from 'vue';
  import { ButtonColor, ButtonSize } from '~/types';

  const props = defineProps({
    /**
     * Size of the button.
     * @type {ButtonSize}
     * @default ButtonSize.NORMAL
     */
    size: {
      type: String as PropType<ButtonSize>,
      default: ButtonSize.NORMAL
    },
    /**
     * Color of the button.
     * @type {ButtonColor}
     * @default ButtonColor.PRIMARY
     */
    color: {
      type: String as PropType<ButtonColor>,
      default: ButtonColor.PRIMARY
    },
    /**
     * Whether the button is disabled.
     * @type {boolean}
     * @default false
     */
    disabled: {
      type: Boolean,
      default: false
    }
  });

  const buttonClasses = computed(() => {
    const sizeClass = props.size === ButtonSize.NORMAL ? 'btn-large' : 'btn-small';
    const colorClass = {
      [ButtonColor.PRIMARY]: 'button-orange',
      [ButtonColor.SECONDARY]: 'button-blue',
      [ButtonColor.SECONDARY_DARK_BG]: 'button-white'
    }[props.color];

    return `${sizeClass} ${colorClass}`;
  });

  const emit = defineEmits(['click']);
  /**
   * Handles the button click event.
   * Emits a click event if the button is not disabled.
   * @param {Event} event - The click event.
   */
  const handleClick = (event: Event) => {
    if (!props.disabled) {
      emit('click', event);
    }
  };
</script>
