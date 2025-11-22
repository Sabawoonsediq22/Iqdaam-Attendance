declare module "embla-carousel-react" {
  export type EmblaApi = {
    scrollPrev: () => void;
    scrollNext: () => void;
    canScrollPrev: () => boolean;
    canScrollNext: () => boolean;
    on: (event: string, cb: (...args: unknown[]) => void) => void;
    off: (event: string, cb: (...args: unknown[]) => void) => void;
    destroy: () => void;
    reInit: () => void;
    [key: string]: unknown;
  };

  export type UseEmblaCarouselType = [
    (node?: HTMLElement | null) => void,
    EmblaApi | undefined
  ];

  export default function useEmblaCarousel(
    opts?: Record<string, unknown>,
    plugins?: unknown[]
  ): UseEmblaCarouselType;
}
