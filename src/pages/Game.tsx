import React, { Fragment } from 'react';
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
  results: {},
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
  results: {
    [keyof: string]: Result,
  };
}

interface StateProps {
  questionnaire: Question[];
  isLoadingMovies: boolean;
}
     
interface DispatchProps {
  getMovies: () => void;
}
 
type Props = StateProps & DispatchProps & OwnProps;

interface AnnyangOptions {
  autorestart: boolean;
  continuous: boolean;
  paused: boolean;
}

interface AnnyangCommands {
  [keyof: string]: () => {}
}

interface Annyang {
  start: (options?: AnnyangOptions) => void;
  abort: () => void;
  addCommands: (commands: AnnyangCommands) => void;
  removeCommands: (command: string) => void;
  addCallback: (event: string, callback: () => void) => void;
}

declare var annyang: Annyang;

class GameComponent extends React.Component<Props, OwnStateProps> {
  constructor(props: Props) {
    super(props);

    const COMMANDS: { [keyof: string]: any } = {
      PASS: {
        phrases: ['pass', 'next', 'don\'t know'],
        callback: this.handlePass,
      },
      CURSE: {
        phrases: ['fuck', 'shit', 'motherfucker'],
        callback: this.handleCurse, 
      },
      HINT: {
        phrases: ['hint', 'clue', 'tell me something I don\'t know'],
        callback: this.handleHintRequest,
      },
      OPTIONS: {
        phrases: ['options', 'show me options', 'give me options'],
        callback: this.handleOptionsRequest,
      },
    };

    const annyangFormattedCommands: { [keyof: string]: any } = {};

    Object.keys(COMMANDS).forEach((commandKey: any) => {
      const { phrases } = COMMANDS[commandKey];

      phrases.forEach((phrase: string) => {
        annyangFormattedCommands[phrase] = COMMANDS[commandKey].callback;
      });
    });

    annyang.addCommands(annyangFormattedCommands);
    annyang.addCallback('resultNoMatch', this.handleNoMatch);

    this.state = INITIAL_STATE;
  }

  updateMoviesOnCommands = () => {
    const { questionnaire } = this.props;

    if (!questionnaire.length) {
      return;
    }

    const { currentQuestionIndex } = this.state;
    const { title: currentMovieTitle } = questionnaire[currentQuestionIndex].movie;

    annyang.addCommands({ [currentMovieTitle.toLocaleLowerCase()]: this.handleMatch } as AnnyangCommands);

    if (currentQuestionIndex >= 1) {
      const { title: previousMovieTitle } = this.props.questionnaire[currentQuestionIndex].movie;
      annyang.removeCommands(previousMovieTitle);
    }

    annyang.start();
  }

  resumeGame = (result: Result) => {
    const { questionnaire } = this.props;
    const { currentQuestionIndex, results } = this.state;

    const newResult = { [result.movie.id]: result };
    const newResults = {...results, ...newResult};
    const nextIndex = currentQuestionIndex + 1;
    const isFinished = nextIndex >= questionnaire.length;

    this.setState({
      results: newResults,
      currentQuestionIndex: currentQuestionIndex + 1,
      status: isFinished ? GameStatus.FINISHED : GameStatus.PLAYING,
    });
  }

  handlePass = () => {
    this.handleNoMatch();
  }

  handleCurse = () => {
    console.log('Put a dollar in that jar boy.');
  }

  handleHintRequest = () => {
    console.log('I\'ll give you the hints when I think you need them, ok?');
  }

  handleOptionsRequest = () => {
    console.log('You want some options? I\'ll give you some options.');
  }

  handleNoMatch = (results?: any) => {
    const { questionnaire } = this.props;
    const { currentQuestionIndex } = this.state;

    const currentMovie = questionnaire[currentQuestionIndex].movie;
    const result: Result = {
      isCorrect: false,
      spokenAnswer: [results],
      movie: currentMovie,
    }

    this.resumeGame(result);
  }

  handleMatch = () => {
    const { currentQuestionIndex } = this.state;
    const { questionnaire } = this.props;
    const currentMovie = questionnaire[currentQuestionIndex].movie;
    const result: Result = {
      isCorrect: true,
      spokenAnswer: [currentMovie.title],
      movie: currentMovie,
    }

    this.resumeGame(result);
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

  onError = () => {
    this.setState({
      status: GameStatus.FAILED,
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

  componentDidUpdate() {
    const { questionnaire } = this.props;
    const { currentQuestionIndex } = this.state;

    if (questionnaire.length > currentQuestionIndex) {
      this.updateMoviesOnCommands();
    } else {
      annyang.abort();
    }
  }

  componentDidMount() {
    const { getMovies } = this.props;

    getMovies();
  }

  render() {
    const { status } = this.state;

    if (status === GameStatus.FAILED) {
      return (
        <p>It seems that your browser doesn't support SpeechRecognition. Please try on latest Chrome on desktop or Android.</p>
      )
    }

    const { questionnaire } = this.props;
    const { results } = this.state;

    if (status === GameStatus.FINISHED) {
      return (
        <>
          <ul>
            {questionnaire.map(({movie}: { movie: Movie}) => (
              <li key={`result-${movie.id}`}>{movie.title}: <b>{results[movie.id] && results[movie.id].isCorrect ? 'Correct' : 'Incorrect.'} </b></li>
            ))}
          </ul>
          <button onClick={this.reset}>Try again!</button>
        </>
      );
    }

    const { isLoadingMovies } = this.props;

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
        <p>{currentQuestionIndex + 1}/{questionnaire.length}</p>
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