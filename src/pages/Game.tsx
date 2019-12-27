import React from 'react';
import { Dispatch } from 'redux';
import { connect } from "react-redux";

import { isLoadingMovies, getQuestionnaire, Question } from "../store/selectors/movies";
import { getMovies as getMoviesAction } from "../store/actions/movies";

import { RootState } from '../store/reducers';
import { Movie } from '../store/reducers/movies';

import { IMAGE_BASE_URL, IMAGE_WIDTH, GAME_TIME } from "../constants/config";
import { Timer } from '../components/game/Timer';
import { GameStatus } from '../constants/game';
import { PhotoCropper } from '../components/game/PhotoCropper';
import { Gallery } from '../components/Gallery';
import { AnswerList, Answer } from '../components/game/AnswerList';

const INITIAL_STATE = {
  status: GameStatus.PLAYING,
  currentQuestionIndex: 0,
  results: [],
};

interface OwnProps {}

interface Result {
  movie: Movie;
  answer: Answer;
  rightAnswer?: Answer;
  isCorrect: boolean;
}

interface OwnStateProps {
  status: GameStatus;
  currentQuestionIndex: number;
  results: Result[];
}

interface StateProps {
  questionnaire: Question[];
  isLoadingMovies: boolean;
}
     
interface DispatchProps {
  getMovies: () => void;
}
 
type Props = StateProps & DispatchProps & OwnProps;

class GameComponent extends React.Component<Props, OwnStateProps> {
  constructor(props: Props) {
    super(props);

    this.state = INITIAL_STATE;
  }

  componentDidMount() {
    const { getMovies } = this.props;

    getMovies();
  }

  onSelect = (answer: Answer) => {
    const { currentQuestionIndex, results } = this.state;
    const { questionnaire } = this.props;
    const currentQuestion = questionnaire[currentQuestionIndex];
    const result : Result = {
      isCorrect: answer.id === currentQuestion.movie.id,
      answer,
      rightAnswer: currentQuestion.answers.find((answer: Answer) => answer.isCorrect),
      movie: currentQuestion.movie,
    };

    const newResults = [...results, result];
    const nextIndex = currentQuestionIndex + 1;
    const isFinished = nextIndex >= questionnaire.length;

    this.setState({
      results: newResults,
      currentQuestionIndex: currentQuestionIndex + 1,
      status: isFinished ? GameStatus.FINISHED : GameStatus.PLAYING,
    });
  }

  finishGame = () => {
    this.setState({
      status: GameStatus.FINISHED,
    });
  }

  reset = () => {
    const { getMovies } = this.props;

    getMovies();

    this.setState(INITIAL_STATE);
  }

  render() {
    const { results, status } = this.state;

    if (status === GameStatus.FINISHED) {
      return (
        <>
          <ul>
            {results.map((result: Result) => (
              <li>{result.movie.title}: {result.isCorrect ? 'Noice' : 'Oh, come on, mate.'} </li>
            ))}
          </ul>
          <button onClick={this.reset}>Try again!</button>
        </>
      );
    }

    const { isLoadingMovies, questionnaire } = this.props;

    if (isLoadingMovies) {
      return (
        <p>Loading...</p>
      )
    }

    if (!questionnaire.length) {
      return (
        <p>Sorry, the movies API is not currently working.</p>
      );
    }

    const { currentQuestionIndex } = this.state;
    const currentQuestion = questionnaire[currentQuestionIndex];

    return (
      <>
        <Timer time={GAME_TIME} onTimeUp={this.finishGame} />
        <Gallery
          currentSlide={currentQuestionIndex}
        >
          {questionnaire && questionnaire.length > 0 && (
            questionnaire.map(({ movie }: { movie: Movie}) => (
              <>
                <p key={`title-${movie.id}`}>{movie.title}</p>
                <PhotoCropper 
                  key={`image-${movie.id}`} 
                  imageUrl={`${IMAGE_BASE_URL}${movie.poster_path}`}
                  expectedImageWidth={IMAGE_WIDTH}
                />
              </>
            ))
          )}
        </Gallery>
        <AnswerList
          answers={currentQuestion.answers}
          onSelect={this.onSelect}
        />
      </>
    )
  }
}
 
function mapStateToProps(state: RootState): StateProps {
  return {
    questionnaire: getQuestionnaire(state),
    isLoadingMovies: isLoadingMovies(state),
  };
}
 
function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
  return {
    getMovies: () => dispatch(getMoviesAction()),
  };
}
  
export const Game = connect<StateProps, any, Props, any>
  (mapStateToProps, mapDispatchToProps)(GameComponent)