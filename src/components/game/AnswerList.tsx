import React, { useState } from 'react';
import * as classnames from 'classnames';

interface Answer {
  id: number;
  label: string;
  isCorrect: boolean;
}

interface Props {
  answers: Answer[];
  onSelect: (answer: Answer) => void;
}

export const AnswerList = (props: Props) => {
  const { answers, onSelect } = props;
  const [ selectedAnswer, selectAnswer ] = useState(-1);

  return (
    <ul>
      {answers.map((answer: Answer, index: number) => {
        const answerClassname = classnames('Answer', {
          'Answer--correct': selectedAnswer === index && answer.isCorrect,
        });

        return (
          <li className={answerClassname}>
            <button onClick={() => {
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