const utilities: { [key:string]: string[]} = {
  animation: [
    'animate-${static}',
  ],
  backdropBlur: [
    'backdrop-blur-${static}',
  ],
  backdropBrightness: [
    'backdrop-brightness-${static}',
  ],
  backdropContrast: [
    'backdrop-contrast-${static}',
  ],
  backdropGrayscale: [
    'backdrop-grayscale-${static}',
  ],
  backdropHueRotate: [
    'backdrop-hue-rotate-${static}',
  ],
  backdropInvert: [
    'backdrop-invert-${static}',
  ],
  backdropOpacity: [
    'backdrop-opacity-${static}',
  ],
  backdropSaturate: [
    'backdrop-saturate-${static}',
  ],
  backdropSepia: [
    'backdrop-sepia-${static}',
  ],
  backgroundColor: [
    'bg-${color}',
  ],
  backgroundImage: [
    'bg-${static}',
  ],
  backgroundOpacity: [
    'bg-opacity-${static}',
    'bg-opacity-${int<=100}',
  ],
  backgroundPosition: [
    'bg-${static}',
  ],
  backgroundSize: [
    'bg-${static}',
  ],
  blur: [
    'blur-${static}',
    'blur-${int}',
    'blur-${size}',
  ],
  borderColor: [
    'border-${color}',
  ],
  borderOpacity: [
    'border-opacity-${static}',
    'border-opacity-${int<=100}',
  ],
  borderRadius: [
    'rounded-${static}',
    'rounded-t-${static}',
    'rounded-l-${static}',
    'rounded-r-${static}',
    'rounded-b-${static}',
    'rounded-tl-${static}',
    'rounded-tr-${static}',
    'rounded-br-${static}',
    'rounded-bl-${static}',

    'rounded-${int}xl',
    'rounded-${size}',
    'rounded-t-${int}xl',
    'rounded-t-${size}',
    'rounded-l-${int}xl',
    'rounded-l-${size}',
    'rounded-r-${int}xl',
    'rounded-r-${size}',
    'rounded-b-${int}xl',
    'rounded-b-${size}',
    'rounded-tl-${int}xl',
    'rounded-tl-${size}',
    'rounded-tr-${int}xl',
    'rounded-tr-${size}',
    'rounded-br-${int}xl',
    'rounded-br-${size}',
    'rounded-bl-${int}xl',
    'rounded-bl-${size}',
  ],
  borderWidth: [
    'border-${static}',
    'border-${int}',
    'border-${size}',
    'border-t-${int}',
    'border-t-${size}',
    'border-r-${int}',
    'border-r-${size}',
    'border-b-${int}',
    'border-b-${size}',
    'border-l-${int}',
    'border-l-${size}',
  ],
  boxShadow: [
    'shadow-${static}',
  ],
  boxShadowColor: [
    'shadow-${color}',
  ],
  brightness: [
    'brightness-${static}',
  ],
  caretColor: [
    'caret-${color}',
  ],
  caretOpacity: [
    'caret-opacity-${static}',
  ],
  container: [
    'container',
  ],
  contrast: [
    'contrast-${static}',
  ],
  cursor: [
    'cursor-${static}',
  ],
  divideColor: [
    'divide-${color}',
  ],
  divideOpacity: [
    'divide-${static}',
    'divide-opacity-${int<=100}',
  ],
  divideWidth: [
    'divide-y-reverse',
    'divide-x-reverse',
    'divide-y-${int}',
    'divide-x-${int}',
  ],
  dropShadow: [
    'drop-shadow-${static}',
  ],
  fill: [
    'fill-${color}',
  ],
  flex: [
    'flex-${static}',
  ],
  flexGrow: [
    'flex-grow-${static}',
  ],
  flexShrink: [
    'flex-shrink-${static}',
  ],
  fontFamily: [
    'font-${static}',
  ],
  fontSize: [
    'text-${static}',
    'text-${int}xl',
  ],
  fontWeight: [
    'font-${static}',
    'font-${int}',
  ],
  gap: [
    'gap-${static}',
    'gap-x-${static}',
    'gap-y-${static}',

    'gap-${float}',
    'gap-x-${float}',
    'gap-y-${float}',

    'gap-${size}',
    'gap-x-${size}',
    'gap-y-${size}',
  ],
  gradientColorStops: [
    'from-${color}',
    'via-${color}',
    'to-${color}',
  ],
  grayscale: [
    'grayscale-${static}',
  ],
  gridAutoColumns: [
    'auto-cols-${static}',
  ],
  gridAutoRows: [
    'auto-rows-${static}',
  ],
  gridColumn: [
    'col-${static}',
    'col-span-${int}',
  ],
  gridColumnEnd: [
    'col-end-${static}',
    'col-end-${int}',
  ],
  gridColumnStart: [
    'col-start-${static}',
    'col-start-${int}',
  ],
  gridRow: [
    'row-${static}',
    'row-span-${int}',
  ],
  gridRowEnd: [
    'row-end-${static}',
    'row-end-${int}',
  ],
  gridRowStart: [
    'row-start-${static}',
    'row-start-${int}',
  ],
  gridTemplateColumns: [
    'grid-cols-${static}',
    'grid-cols-${int}',
  ],
  gridTemplateRows: [
    'grid-rows-${static}',
    'grid-rows-${int}',
  ],
  height: [
    'h-${static}',
    'h-${float}',
    'h-${fraction}',
    'h-${int}xl',
    'h-${size}',
  ],
  hueRotate: [
    'hue-rotate-${static}',
  ],
  inset: [
    'inset-${static}',
    'inset-${float}',
    'inset-${fraction}',
    'inset-${size}',

    'inset-y-${static}',
    'inset-y-${float}',
    'inset-y-${fraction}',
    'inset-y-${size}',

    'inset-x-${static}',
    'inset-x-${float}',
    'inset-x-${fraction}',
    'inset-x-${size}',

    'top-${static}',
    'top-${float}',
    'top-${fraction}',
    'top-${size}',

    'right-${static}',
    'right-${float}',
    'right-${fraction}',
    'right-${size}',

    'bottom-${static}',
    'bottom-${float}',
    'bottom-${fraction}',
    'bottom-${size}',

    'left-${static}',
    'left-${float}',
    'left-${fraction}',
    'left-${size}',
  ],
  invert: [
    'invert-${static}',
  ],
  letterSpacing: [
    'tracking-${static}',
    'tracking-${size}',
  ],
  lineHeight: [
    'leading-${static}',
    'leading-${int}',
    'leading-${size}',
  ],
  listStyleType: [
    'list-${static}',
  ],
  margin: [
    'm-${static}',
    'my-${static}',
    'mx-${static}',
    'mt-${static}',
    'mr-${static}',
    'mb-${static}',
    'ml-${static}',

    'm-${float}',
    'my-${float}',
    'mx-${float}',
    'mt-${float}',
    'mr-${float}',
    'mb-${float}',
    'ml-${float}',

    'm-${size}',
    'my-${size}',
    'mx-${size}',
    'mt-${size}',
    'mr-${size}',
    'mb-${size}',
    'ml-${size}',
  ],
  maxHeight: [
    'max-h-${static}',
    'max-h-${float}',
    'max-h-${fraction}',
    'max-h-${int}xl',
    'max-h-${size}',
  ],
  maxWidth: [
    'max-w-${static}',
    'max-w-${float}',
    'max-w-${fraction}',
    'max-w-${int}xl',
    'max-w-${size}',
  ],
  minHeight: [
    'min-h-${static}',
    'min-h-${float}',
    'min-h-${fraction}',
    'min-h-${int}xl',
    'min-h-${size}',
  ],
  minWidth: [
    'min-w-${static}',
    'min-w-${float}',
    'min-w-${fraction}',
    'min-w-${int}xl',
    'min-w-${size}',
  ],
  objectPosition: [
    'object-${static}',
  ],
  opacity: [
    'opacity-${static}',
    'opacity-${int<=100}',
  ],
  order: [
    'order-${static}',
    'order-${int}',
  ],
  outline: [
    'outline-${static}',
  ],
  outlineColor: [
    'outline-${color}',
    'outline-solid-${color}',
    'outline-dotted-${color}',
  ],
  padding: [
    'p-${static}',
    'py-${static}',
    'px-${static}',
    'pt-${static}',
    'pr-${static}',
    'pb-${static}',
    'pl-${static}',

    'p-${float}',
    'py-${float}',
    'px-${float}',
    'pt-${float}',
    'pr-${float}',
    'pb-${float}',
    'pl-${float}',

    'p-${size}',
    'py-${size}',
    'px-${size}',
    'pt-${size}',
    'pr-${size}',
    'pb-${size}',
    'pl-${size}',
  ],
  perspective: [
    'perspect-${static}',
  ],
  perspectiveOrigin: [
    'perspect-origin-${static}',
  ],
  placeholderColor: [
    'placeholder-${color}',
  ],
  placeholderOpacity: [
    'placeholder-opacity-${static}',
    'placeholder-opacity-${int<=100}',
  ],
  ringColor: [
    'ring-${color}',
  ],
  ringOffsetColor: [
    'ring-offset-${color}',
  ],
  ringOffsetWidth: [
    'ring-offset-${static}',
    'ring-offset-${int}',
  ],
  ringOpacity: [
    'ring-${static}',
    'ring-opacity-${int<=100}',
  ],
  ringWidth: [
    'ring-${static}',
    'ring-${int}',
  ],
  rotate: [
    'rotate-${static}',
    'rotate-x-${static}',
    'rotate-y-${static}',
    'rotate-z-${static}',
    'rotate-${float}',
    'rotate-x-${float}',
    'rotate-y-${float}',
    'rotate-z-${float}',
  ],
  saturate: [
    'saturate-${static}',
  ],
  scale: [
    'scale-${static}',
    'scale-${int}',
    'scale-x-${static}',
    'scale-x-${int}',
    'scale-y-${static}',
    'scale-y-${int}',
    'scale-z-${static}',
    'scale-z-${int}',
  ],
  sepia: [
    'sepia-${static}',
  ],
  skew: [
    'skew-x-${static}',
    'skew-x-${float}',
    'skew-y-${static}',
    'skew-y-${float}',
  ],
  space: [
    'space-y-${static}',
    'space-y-reverse',
    'space-x-${static}',
    'space-x-reverse',
    'space-y-${float}',
    'space-x-${float}',
  ],
  stroke: [
    'stroke-${color}',
  ],
  strokeWidth: [
    'stroke-${static}',
    'stroke-${int}',
  ],
  strokeDashArray: [
    'stroke-dash-${static}',
    'stroke-dash-${int}',
  ],
  strokeDashOffset: [
    'stroke-offset-${static}',
    'stroke-offset-${int}',
  ],
  tabSize: [
    'tab-${static}',
  ],
  textColor: [
    'text-${color}',
  ],
  textOpacity: [
    'text-opacity-${static}',
    'text-opacity-${int<=100}',
  ],
  textShadow: [
    'text-shadow-${static}',
  ],
  textDecorationColor: [
    'underline-${color}',
  ],
  textDecorationOpacity: [
    'underline-opacity-${static}',
    'underline-opacity-${int<=100}',
  ],
  textDecorationLength: [
    'underline-${static}',
    'underline-${int}',
    'underline-${size}',
  ],
  textDecorationOffset: [
    'underline-offset-${static}',
    'underline-offset-${int}',
    'underline-offset-${size}',
  ],
  textIndent: [
    'indent-${static}',
    'indent-${size}',
  ],
  textStrokeColor: [
    'text-stroke-${color}',
  ],
  textStrokeWidth: [
    'text-stroke-${static}',
    'text-stroke-${size}',
  ],
  transformOrigin: [
    'origin-${static}',
  ],
  transitionDuration: [
    'duration-${static}',
    'duration-${int}',
  ],
  transitionDelay: [
    'delay-${static}',
    'delay-${int}',
  ],
  transitionProperty: [
    'transition-${static}',
  ],
  transitionTimingFunction: [
    'ease-${static}',
  ],
  translate: [
    'translate-${static}',
    'translate-x-${static}',
    'translate-y-${static}',
    'translate-z-${static}',
    'translate-x-${float}',
    'translate-x-${fraction}',
    'translate-x-${size}',
    'translate-y-${float}',
    'translate-y-${fraction}',
    'translate-y-${size}',
    'translate-z-${float}',
    'translate-z-${fraction}',
    'translate-z-${size}',
  ],
  width: [
    'w-${static}',
    'w-${float}',
    'w-${fraction}',
    'w-${int}xl',
    'w-${size}',
  ],
  zIndex: [
    'z-${static}',
    'z-${int}',
  ],

  // Plugins
  typography: [
    'prose-sm',
    'prose',
    'prose-lg',
    'prose-xl',
    'prose-2xl',
    'prose-red',
    'prose-yellow',
    'prose-green',
    'prose-blue',
    'prose-indigo',
    'prose-purple',
    'prose-pink',
  ],
  aspectRatio: [
    'aspect-none',
    'aspect-w-${float}',
    'aspect-h-${float}',
    'aspect-${fraction}',
  ],
  lineClamp: [
    'line-clamp-none',
    'line-clamp-${int}',
  ],
};

const negative: { [key:string]: true} = {
  inset: true,
  zIndex: true,
  order: true,
  margin: true,
  space: true,
  letterSpacing: true,
  rotate: true,
  translate: true,
  skew: true,
};

export { utilities, negative };
