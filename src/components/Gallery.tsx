import React from 'react';
import Swiper, { SwiperOptions } from 'swiper';

const SWIPER_DEFAULT_OPTIONS: SwiperOptions = {
  autoplay: false,
};

export interface OwnProps {
  currentSlide: number;
  options: SwiperOptions;
}

export interface OwnState {
  currentSlide: number;
  swiper?: Swiper;
}

class GameComponent extends React.Component<OwnProps, OwnState> {
  swiperContainer!: HTMLDivElement;

  constructor(props: OwnProps) {
    super(props);

    this.state = {
      currentSlide: 0,
    };
  }

  componentDidMount() {
    const { options } = this.props;

    this.setState({
      swiper: new Swiper(
        this.swiperContainer,
        {
          ...SWIPER_DEFAULT_OPTIONS,
          ...options,
        },
      ),
    });
  }

  componentWillUpdate(nextProps: OwnProps) {
    const { currentSlide } = this.state;
    const { currentSlide: nextSlide } = nextProps;

    if (currentSlide != nextSlide) {
      const { swiper } = this.state;

      swiper?.slideTo(nextSlide);
    }
  }

  render() {
    const { children } = this.props;

    return (
      <div className="Swiper" ref={(el: HTMLDivElement) => { this.swiperContainer = el;}}>
        {React.Children.map(children, (child: React.ReactNode) => (child))}
      </div>
    )
  }
}
