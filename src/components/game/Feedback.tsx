import React from 'react';
import classnames from 'classnames';

import { Question } from '../../store/selectors/movies';

import { PhotoCropper, ImagePosition } from './PhotoCropper';
import { IMAGE_BASE_URL, THUMBNAIL_WIDTH } from '../../constants/config';
import { Result } from '../../pages/Game';
import { Movie } from '../../store/reducers/movies';

interface Props {
  currentQuestionIndex: number;
  imagePosition: ImagePosition;
  questionnaire: Question[];
  results: {
    [keyof: string]: Result,
  };
}

export const Feedback = (props: Props) => {
  const {
    imagePosition,
    currentQuestionIndex,
    questionnaire,
    results,
  } = props;

  return (
    <ul className="pure-menu-list container">
      {questionnaire.map((question: Question, index: number) => {
        const movie: Movie = question.movie;
        const thumbnailClasses =  classnames('movie-thumb', {
          'current-movie': currentQuestionIndex === index,
        });

        return (
          <li key={`result-${movie.id}`} className="pure-menu-item">
            <PhotoCropper
              classes={thumbnailClasses}
              imageUrl={`${IMAGE_BASE_URL}${movie.poster_path}`}
              expectedImageWidth={THUMBNAIL_WIDTH}
              imagePosition={imagePosition}
            />
            {results[movie.id] && (
              <span>{movie.title}: <b>{results[movie.id] && results[movie.id].isCorrect ? 'Correct' : 'Incorrect'}</b></span>
            )}
          </li>
        )
      })}
    </ul>
  )
};