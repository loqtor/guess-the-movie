import React, { useState } from 'react';

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
    <ul className="AnswerList">
      {answers.map((answer: Answer, index: number) => {
        return (
          <li key={answer.id} className="AnswerList-item">
            <button className="Button Button--secondary" onClick={() => {
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