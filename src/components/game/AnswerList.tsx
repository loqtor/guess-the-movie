import React, { useState } from 'react';
import classnames from 'classnames';

export interface Answer {
  id: number | string;
  label: string;
  isCorrect?: boolean;
}

interface Props {
  answers: Answer[];
  onSelect: (answer: Answer) => void;
}

export const AnswerList = (props: Props) => {
  const { answers, onSelect } = props;
  const [ selectedAnswer, selectAnswer ] = useState(-1);

  return (
    <ul className="pure-menu-list">
      {answers.map((answer: Answer, index: number) => {
        const answerClassname = classnames('Answer pure-menu-item margin-bottom', {
          'Answer--correct': selectedAnswer === index && answer.isCorrect,
        });

        return (
          <li key={answer.id} className={answerClassname}>
            <button className="pure-button" onClick={() => {
              selectAnswer(index);
              onSelect(answer);
            }}>
              {answer.label}
            </button>
          </li>
        );
      })}
    </ul>
  );
};