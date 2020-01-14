import React from 'react';
import classnames from 'classnames';

import { Question } from '../../store/selectors/movies';

import { Result } from '../../pages/Game';
import { Movie } from '../../store/reducers/movies';

interface Props {
  currentQuestionIndex: number;
  questionnaire: Question[];
  results: {
    [keyof: string]: Result,
  };
}

export const Feedback = (props: Props) => {
  const {
    questionnaire,
    results,
  } = props;


  return (
    <ol className="FeedbackList">
      {questionnaire.map((question: Question, index: number) => {
        const movie: Movie = question.movie;
        const isCorrect = results[movie.id] && results[movie.id].isCorrect;
        const isIncorrect = results[movie.id] && !results[movie.id].isCorrect;

        const itemClasses =  classnames('FeedbackList-item', {
          'is-correct': isCorrect,
          'is-incorrect': isIncorrect,
        });


        return (
          <li key={`result-${movie.id}`} className={itemClasses}>
            {results[movie.id] ? (
              // The visible answer
              <p className="FeedbackList-item-answer">
                {movie.title}
              </p>
            ) : (
              // Placeholder before answer is shown
              <p className="FeedbackList-item-placeholder">
                {movie.title}
              </p>
            )}
          </li>
        )
      })}
    </ol>
  )
};