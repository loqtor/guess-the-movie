import React, { Component } from 'react';
import { generateRandomNumberFromRange } from '../../tools/util';

export interface ImagePosition {
  x: number;
  y: number;
}

interface Props {
  imageUrl: string;
  imagePosition?: ImagePosition;
  expectedImageWidth?: number;
  onMounted?: (position: ImagePosition) => void;
}

interface State {
  imagePosition: ImagePosition;
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

export const PhotoCropper = class PhotoCropper extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const { imagePosition } = this.props;

    if (imagePosition) {
      this.state = {
        imagePosition,
      };
    } else {
      this.state = {
        imagePosition: setImagePosition(),
      };
    }
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

export const setImagePosition = (): ImagePosition => {
  return {
    x: generateRandomNumberFromRange(POSITION_BOUNDARIES_X.max, POSITION_BOUNDARIES_X.min),
    y: generateRandomNumberFromRange(POSITION_BOUNDARIES_Y.max, POSITION_BOUNDARIES_Y.min),
  };
}