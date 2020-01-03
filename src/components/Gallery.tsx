import React from 'react';
import Swiper, { SwiperOptions } from 'swiper';

const SWIPER_DEFAULT_OPTIONS: SwiperOptions = {
  direction: 'horizontal',
  slidesPerView: 1,
  containerModifierClass: 'swiper-container',
  wrapperClass: 'swiper-wrapper',
  slideClass: 'swiper-slide',
  slideActiveClass: 'swiper-slide--active',
  slideVisibleClass: 'swiper-slide--visible',
  slideNextClass: 'swiper-slide--next',
  slidePrevClass: 'swiper-slide--prev',
  navigation: {
    nextEl: '.swiper-button--next',
    prevEl: '.swiper-button--prev',
  },
  allowTouchMove: false,
};

export interface OwnProps {
  currentSlide?: number;
  options?: SwiperOptions;
}

export interface OwnState {
  currentSlide: number;
  swiper?: Swiper;
  options?: SwiperOptions;
}

export class Gallery extends React.Component<OwnProps, OwnState> {
  swiperContainer!: HTMLDivElement;

  constructor(props: OwnProps) {
    super(props);

    this.state = {
      currentSlide: props.currentSlide || 0,
      options: {
        ...SWIPER_DEFAULT_OPTIONS,
        ...props.options,
      }
    };
  }

  componentDidMount() {
    const { options } = this.props;
    const swiper = new Swiper(
      this.swiperContainer,
      {
        ...SWIPER_DEFAULT_OPTIONS,
        ...options,
      },
    );

    this.setState({
      swiper,
    });
  }

  componentWillUpdate(nextProps: OwnProps) {
    const { currentSlide } = this.state;
    const { currentSlide: nextSlide } = nextProps;

    if (currentSlide !== nextSlide) {
      const { swiper } = this.state;

      swiper?.slideTo(
        nextSlide !== 0 && !nextSlide ?
          currentSlide :
          nextSlide
        );
    }
  }

  render() {
    const { children } = this.props;
    const { options, currentSlide } = this.state;

    return (
      <div
        className={options?.containerModifierClass}
        ref={(el: HTMLDivElement) => { this.swiperContainer = el;}}
      >
        <div className={options?.wrapperClass}>
          {React.Children.map(children, (child: React.ReactNode, i: number) => (
            <div className={`${options?.slideClass} ${currentSlide === i ? options?.slideActiveClass : ''}`}>
              {child}
            </div>
          ))}
        </div>
        <div className={options?.slideNextClass}></div>
        <div className={options?.slidePrevClass}></div>
      </div>
    )
  }
}
