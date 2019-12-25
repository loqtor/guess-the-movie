import React from 'react';
import { generateRandomNumberFromRange } from '../../tools/util';

interface IProps {
  imageUrl: string;
  imagePositionX?: number;
  imagePositionY?: number;
  expectedImageWidth?: number;
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

export const PhotoCropper = (props: IProps) => {
  const { imageUrl, imagePositionX, imagePositionY, expectedImageWidth } = props;
  const imagePosition = setImagePosition(imagePositionX, imagePositionY);
  const finalImageWidth = expectedImageWidth || DEFAULT_IMAGE_WIDTH;

  const imageStyles = {
    maxWidth: `${finalImageWidth / 2}px`, // ensures it's cropped
    objectFit: 'none',
    objectPosition: imagePosition,
  } as React.CSSProperties;
  
  return (
    <img style={imageStyles} src={imageUrl}/>
  );
};

const setImagePosition = (positionX?: number, positionY?: number) => {
  const positionXFinal = positionX || positionX === 0 ?
    positionX:
    generateRandomNumberFromRange(POSITION_BOUNDARIES_X.max, POSITION_BOUNDARIES_X.min);

  const positionYFinal = positionY || positionY === 0 ?
    positionY:
    generateRandomNumberFromRange(POSITION_BOUNDARIES_Y.max, POSITION_BOUNDARIES_Y.min);

  return `${positionXFinal}% ${positionYFinal}%`;
}