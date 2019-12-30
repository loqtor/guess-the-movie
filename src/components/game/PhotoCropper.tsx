import React, { Component } from 'react';
import { generateRandomNumberFromRange } from '../../tools/util';

export interface IImagePosition {
  x: number;
  y: number;
}

interface IProps {
  imageUrl: string;
  imagePositionX?: number;
  imagePositionY?: number;
  expectedImageWidth?: number;
  onMounted?: (position: IImagePosition) => void;
}

interface IState {
  imagePosition: IImagePosition;
}

const POSITION_BOUNDARIES_X = {
  max: 25,
  min: 75,
};

const POSITION_BOUNDARIES_Y = {
  max: 30,
  min: 60,
};

const DEFAULT_IMAGE_WIDTH = 1000;

export const PhotoCropper = class PhotoCropper extends Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    const { imagePositionX, imagePositionY } = this.props;
    this.state = {
      imagePosition: setImagePosition(imagePositionX, imagePositionY),
    };
  }

  componentDidMount() {
    const { onMounted } = this.props;

    if (onMounted) {
      onMounted(this.state.imagePosition);
    }
  }

  render() {
    const { imageUrl, expectedImageWidth } = this.props;
    const { imagePosition } = this.state;
    const finalImageWidth = expectedImageWidth || DEFAULT_IMAGE_WIDTH;
  
    const imageStyles = {
      maxWidth: `${finalImageWidth / 2}px`, // ensures it's cropped
      objectFit: 'none',
      objectPosition: `${imagePosition.x}% ${imagePosition.y}%`,
    } as React.CSSProperties;
    
    return (
      <img style={imageStyles} src={imageUrl}/>
    );
  }
};

const setImagePosition = (positionX?: number, positionY?: number): IImagePosition => {
  const positionXFinal = positionX || positionX === 0 ?
    positionX:
    generateRandomNumberFromRange(POSITION_BOUNDARIES_X.max, POSITION_BOUNDARIES_X.min);

  const positionYFinal = positionY || positionY === 0 ?
    positionY:
    generateRandomNumberFromRange(POSITION_BOUNDARIES_Y.max, POSITION_BOUNDARIES_Y.min);

  return {
    x: positionXFinal,
    y: positionYFinal,
  };
}