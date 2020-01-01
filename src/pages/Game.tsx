import React from 'react';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import classnames from 'classnames';
import FuzzySet from 'fuzzyset.js';

import { isLoadingMovies, getQuestionnaire, Question } from '../store/selectors/movies';
import { getMovies as getMoviesAction } from '../store/actions/movies';

import { RootState } from '../store/reducers';
import { Movie } from '../store/reducers/movies';

import { IMAGE_BASE_URL, IMAGE_WIDTH, GAME_TIME, THUMBNAIL_WIDTH } from '../constants/config';
import { Timer } from '../components/game/Timer';
import { GameStatus } from '../constants/game';
import { PhotoCropper, ImagePosition, setImagePosition } from '../components/game/PhotoCropper';
import { Gallery } from '../components/Gallery';
import { AnswerList, Answer } from '../components/game/AnswerList';

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
  shouldShowOptions: boolean;
  currentPosterPosition?: ImagePosition;
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
  isListening: () => boolean;
}

declare var annyang: Annyang;

const INITIAL_STATE = {
  status: GameStatus.STARTING,
  currentQuestionIndex: 0,
  results: {},
  shouldShowOptions: false,
};

/**
 * Percentage of coincidence between result and what the movie title is.
 */
const MATCH_THRESHOLD = 0.7;
const START_COUNTDOWN_TIME = 3; // seconds

class GameComponent extends React.Component<Props, OwnStateProps> {
  fuzzy: any;

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
      OPTIONS: {
        phrases: ['show options'],
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

  saveImagePosition = (currentPosterPosition: ImagePosition) => {
    this.setState({
      currentPosterPosition,
    });
  }

  isItAFuzzyMatch = (results: string[]) => {
    if (!results || !results.length) {
      return false;
    }

    const { currentQuestionIndex } = this.state;
    const { questionnaire } = this.props;
    const { title: currentMovieTitle } = questionnaire[currentQuestionIndex].movie;
    const match = results.find((result: string) => this.fuzzy.get(result) >= MATCH_THRESHOLD);

    return currentMovieTitle === match;
  }

  /**
   * This ensures that only the current movie title is accepted as a command.
   * Removes the previous one and adds the current.
   */
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

    if (!annyang.isListening()) {
      annyang.start();
    }
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
      shouldShowOptions: false,
      currentPosterPosition: undefined,
    });
  }

  handlePass = () => {
    this.handleNoMatch();
  }

  handleCurse = () => {
    console.log('Put a dollar in that jar boy.');
  }

  handleOptionsRequest = () => {
    this.setState({
      shouldShowOptions: true,
    });
  }

  handleNoMatch = (results?: any) => {
    /**
     * Speech Recognition seems to struggle with accents.
     * This is to make it a bit more _lax_ in how it compares strings considering
     * that movies titles might not be the easiest to "understand".
     */
    if (this.isItAFuzzyMatch(results)) {
      this.handleMatch();
      return;
    }

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

  startGame = () => {
    this.setState({
      status: GameStatus.PLAYING,
    });
  }

  finishGame = () => {
    annyang.abort();

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

    if (currentQuestionIndex === 0 && questionnaire.length > 0) {
      const titles = questionnaire.map((question: Question) => question.movie.title)
      this.fuzzy = FuzzySet(titles);
    }

    if (questionnaire.length > currentQuestionIndex) {
      this.updateMoviesOnCommands();
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
        <p>It seems that your browser doesn't support SpeechRecognition. Please try on the latest Chrome on desktop or Android.</p>
      )
    }

    const { questionnaire } = this.props;
    const { results } = this.state;

    if (status === GameStatus.FINISHED) {
      return (
        <>
          <ul className="pure-menu-list">
            {questionnaire.map(({movie}: { movie: Movie}) => (
              <li className="pure-menu-item" key={`result-${movie.id}`}>{movie.title}: <b>{results[movie.id] && results[movie.id].isCorrect ? 'Correct' : 'Incorrect.'} </b></li>
            ))}
          </ul>
          <button className="pure-button" onClick={this.reset}>Try again!</button>
        </>
      );
    }

    if (status === GameStatus.STARTING) {
      return (
        <Timer
          time={START_COUNTDOWN_TIME}
          onTimeUp={this.startGame}
          unformatted={true}
        />
      )
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

    const { currentQuestionIndex, currentPosterPosition, shouldShowOptions } = this.state;
    const currentQuestion = questionnaire[currentQuestionIndex];
    let photoCropperProps: any = {
      expectedImageWidth: IMAGE_WIDTH,
      onMounted: this.saveImagePosition,
    };

    /**
     * This ensures that both the poster and the thumbnail would be cropped
     * the same way.
     */
    if (currentPosterPosition) {
      photoCropperProps = {
        ...photoCropperProps,
        imagePosition: setImagePosition(),
      };
    } else {
      photoCropperProps = {
        ...photoCropperProps,
        imagePosition: currentPosterPosition,
      };
    }

    return (
      <>
        <h2 className="text-centered">What's the movie?</h2>
        <div className="pure-g">
          <div className="pure-u-1-3">
            <div className="pure-g">
              <div className="pure-u-3-4">
                <div className="container">
                  <p className="text-right">Time</p>
                  <p className="text-right">Question</p>
                </div>
              </div>
              <div className="pure-u-1-4">
                <div className="container">
                  <Timer
                    time={GAME_TIME}
                    onTimeUp={this.finishGame}
                    timeRunningOutClassesThreshold={5}
                    timeRunningOutClasses='text-red text-bold'
                  />
                {currentQuestionIndex + 1}/{questionnaire.length}
                </div>
              </div>
            </div>
          </div>
          <div className="pure-u-1-3">
            <Gallery
              currentSlide={currentQuestionIndex}
            >
              {questionnaire && questionnaire.length > 0 && (
                questionnaire.map(({ movie }: { movie: Movie}) => (
                  <PhotoCropper
                    key={`gallery-poster-${movie.id}`}
                    imageUrl={`${IMAGE_BASE_URL}${movie.poster_path}`}
                    {...photoCropperProps}
                  />
                ))
              )}
            </Gallery>
            <h3>If you need help, just say "show options"</h3>
            {shouldShowOptions && (
              <AnswerList
                answers={currentQuestion.answers}
                onSelect={this.onSelect}
              />
            )}
          </div>
          <div className="pure-u-1-3">
            <ul className="pure-menu-list container">
              {questionnaire.map((question: Question, index: number) => {
                const { movie } = question;
                const thumbnailClasses =  classnames('movie-thumb', {
                  'current-movie': currentQuestionIndex === index,
                });

                return (
                  <li key={`result-${movie.id}`} className="pure-menu-item">
                    <PhotoCropper
                      classes={thumbnailClasses}
                      imageUrl={`${IMAGE_BASE_URL}${movie.poster_path}`}
                      expectedImageWidth={THUMBNAIL_WIDTH}
                      imagePosition={currentPosterPosition}
                    />
                    {results[movie.id] && (
                      <span>{movie.title}: <b>{results[movie.id] && results[movie.id].isCorrect ? 'Correct' : 'Incorrect'}</b></span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
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