import React, { Fragment } from 'react';
import { Dispatch } from 'redux';
import { connect } from "react-redux";

import { isLoadingMovies, getQuestionnaire, Question } from "../store/selectors/movies";
import { getMovies as getMoviesAction } from "../store/actions/movies";

import { RootState } from '../store/reducers';
import { Movie } from '../store/reducers/movies';

import { IMAGE_BASE_URL, IMAGE_WIDTH, GAME_TIME } from "../constants/config";
// import { SpeechRecognizer } from 'react-speech-recognizer-component';
import { SpeechRecognizer } from '../components/SpeechRecognizer';
import { Timer } from '../components/game/Timer';
import { GameStatus } from '../constants/game';
import { PhotoCropper } from '../components/game/PhotoCropper';
import { Gallery } from '../components/Gallery';
import { AnswerList, Answer } from '../components/game/AnswerList';

import { COMMANDS } from '../constants/game';
import { detectCommand } from "../tools/game";

const INITIAL_STATE = {
  status: GameStatus.PLAYING,
  currentQuestionIndex: 0,
  results: [],
};

interface OwnProps {}

interface Result {
  movie: Movie;
  answer?: Answer;
  spokenAnswer?: string[];
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

  resumeGame = (result: Result) => {
    const { questionnaire } = this.props;
    const { currentQuestionIndex, results } = this.state;

    const newResults = [...results, result];
    const nextIndex = currentQuestionIndex + 1;
    const isFinished = nextIndex >= questionnaire.length;

    this.setState({
      results: newResults,
      currentQuestionIndex: currentQuestionIndex + 1,
      status: isFinished ? GameStatus.FINISHED : GameStatus.PLAYING,
    });
  }

  onSelect = (answer: Answer) => {
    const { currentQuestionIndex } = this.state;
    const { questionnaire } = this.props;
    const currentQuestion = questionnaire[currentQuestionIndex];
    const result : Result = {
      isCorrect: answer.id === currentQuestion.movie.id,
      answer,
      movie: currentQuestion.movie,
    };

    this.resumeGame(result);
  }

  onStart = () => {
    console.log('Speech recognition started.');
  }

  onResult = (_: any, __: any, transcripts: string[]) => {
    const shouldGoNext = detectCommand(COMMANDS.PASS, transcripts);
    const { currentQuestionIndex } = this.state;

    if (shouldGoNext) {
      this.setState({
        currentQuestionIndex: currentQuestionIndex + 1,
      });

      return;
    }

    const shouldShowHint = detectCommand(COMMANDS.HINT, transcripts);

    if (shouldShowHint) {
      console.log('Hint requested, transcript: ', transcripts);
      return;
    }

    const shouldShowOptions = detectCommand(COMMANDS.OPTIONS, transcripts);

    if (shouldShowOptions) {
      console.log('Options requested, transcript: ', transcripts);
    }

    const { questionnaire } = this.props;
    const currentMovie = questionnaire[currentQuestionIndex].movie;
    const titleFormatted = currentMovie.title.toLowerCase(); 
    const isItTheRightAnswer = transcripts.find((transcript: string) => transcript === titleFormatted);
    const result: Result = {
      isCorrect: !!isItTheRightAnswer,
      spokenAnswer: transcripts,
      movie: currentMovie,
    }

    this.resumeGame(result);
  }

  onError = () => {
    debugger;
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
        <SpeechRecognizer
          startSpeechRecognition={true}
          onStart={this.onStart}
          onResult={this.onResult}
          onError={this.onError}
          dontRender={true}
          interimResults={false}
        />
        <Timer time={GAME_TIME} onTimeUp={this.finishGame} />
        <Gallery
          currentSlide={currentQuestionIndex}
        >
          {questionnaire && questionnaire.length > 0 && (
            questionnaire.map(({ movie }: { movie: Movie}) => (
              <Fragment key={movie.id}>
                <PhotoCropper
                  imageUrl={`${IMAGE_BASE_URL}${movie.poster_path}`}
                  expectedImageWidth={IMAGE_WIDTH}
                />
              </Fragment>
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