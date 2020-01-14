import React from 'react';
import ReactGA from 'react-ga';
import { Dispatch } from 'redux';
import { connect } from 'react-redux';
import FuzzySet from 'fuzzyset.js';

import { isLoadingMovies, getQuestionnaire, Question } from '../store/selectors/movies';
import { getMovies as getMoviesAction } from '../store/actions/movies';

import { RootState } from '../store/reducers';
import { Movie } from '../store/reducers/movies';

import { IMAGE_BASE_URL, IMAGE_WIDTH, GAME_TIME } from '../constants/config';
import { Timer } from '../components/game/Timer';
import { GameStatus, GameError } from '../constants/game';
import { PhotoCropper, ImagePosition, setImagePosition } from '../components/game/PhotoCropper';
import { Gallery } from '../components/Gallery';
import { AnswerList, Answer } from '../components/game/AnswerList';
import { Feedback } from '../components/game/Feedback';
import { Notification } from '../components/Notification';
import { generateRandomNumberFromRange } from '../tools/util';

interface OwnProps {}

export interface Result {
  movie: Movie;
  answer?: Answer;
  spokenAnswer?: string[];
  isCorrect: boolean;
}

interface OwnStateProps {
  currentPosterPosition?: ImagePosition;
  currentQuestionIndex: number;
  error?: GameError;
  hint?: string;
  results: {
    [keyof: string]: Result,
  };
  shouldShowHint: boolean;
  shouldShowOptions: boolean;
  status: GameStatus;

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
  removeCallback: (type: string, callback?: () => {}) => void;
  addCallback: (event: string, callback: (results?: string[]) => void) => void;
  isListening: () => boolean;
}

declare var annyang: Annyang;

const BASE_STATE = {
  status: GameStatus.AUTHORIZING,
  currentQuestionIndex: 0,
  results: {},
  shouldShowHint: false,
  shouldShowOptions: false
}

const INITIAL_STATE = {
  ...BASE_STATE,
};

const UNSUPPORTED_STATE = {
  ...BASE_STATE,
  status: GameStatus.FAILED,
  error: GameError.UNSUPPORTED,
};

const RESET_STATE = {
  ...BASE_STATE,
  status: GameStatus.STARTING,
};


const COUNTDOWN_TIME = 3; // seconds
const FUZZY_MATCH_THRESHOLD = 0.2; // Percentage of coincidence between result and what the movie title is.
const MATCH_THRESHOLD = 0.8;
const HINT_PERCENT_TO_REPLACE = 20; // Percentage of the subtitle to be displayed when showing a hint.
const HINT_CHARACTER = '_';
const HINT_REPLACEABLE_CHARACTERS = /^[a-zA-Z0-9]+$/; // Only Alphanumeric characters are to be replaced for hints.
const ENABLE_GUESSING_COMMAND = 'yo';

class GameComponent extends React.Component<Props, OwnStateProps> {
  fuzzy: any;
  timeLeft: number = GAME_TIME;

  constructor(props: Props) {
    super(props);

    /**
     * When Speech Recognition is not supported Annyang is not initialised
     * and just set to null. This prevents exceptions from happening in those browsers
     * where SR is not supported.
     */
    if (!annyang) {
      this.state = UNSUPPORTED_STATE;

      ReactGA.event({
        category: 'Error',
        action: 'SR is not supported in this browser.',
      });

      return;
    }

    const COMMANDS: { [keyof: string]: any } = {
      GUESS: {
        phrases: [ENABLE_GUESSING_COMMAND],
        callback: this.handleGuessRequest,
      },
      OPTIONS: {
        phrases: ['show options'],
        callback: this.handleOptionsRequest,
      },
      PASS: {
        phrases: ['pass', 'next', 'don\'t know'],
        callback: this.handlePass,
      },
      CURSE: {
        phrases: ['fuck', 'shit', 'motherfucker'],
        callback: this.handleCurse,
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

    annyang.addCallback('errorPermissionBlocked', this.handlePermissionBlocked);
    annyang.addCallback('errorPermissionDenied', this.handlePermissionDenied);
    annyang.addCallback('start', this.handleStart);
    annyang.addCallback('resultNoMatch', (results?: string[]) => {
      const { status } = this.state;

      /**
       * Only attempt fuzzy matches once the user has said
       * "The movie is"
       */
      if (status !== GameStatus.GUESSING) {
        return;
      }

      this.handleNoMatch(results);
    });

    this.state = INITIAL_STATE;
  }

  saveImagePosition = (currentPosterPosition: ImagePosition) => {
    this.setState({
      currentPosterPosition,
    });
  }

  getFuzzyMatch = (results: string[]) => {
    if (!results || !results.length) {
      return false;
    }

    let fuzzyMatch: [number, string] = [0, ''];
    const { currentQuestionIndex } = this.state;
    const { questionnaire } = this.props;
    const { title: currentMovieTitle } = questionnaire[currentQuestionIndex].movie;
    const fuzzyMatchingResult = results.find((result: string) => {
      const matches = this.fuzzy.get(result);

      if (!matches) {
        return false;
      }

      const currentMovieMatch = matches.find((match: [number, string]) => currentMovieTitle === match[1]);
      const isItAFuzzyMatch = currentMovieMatch && currentMovieMatch[0] >= FUZZY_MATCH_THRESHOLD;

      if (isItAFuzzyMatch) {
        fuzzyMatch = currentMovieMatch;
      }

      return isItAFuzzyMatch;
    });

    if (!fuzzyMatchingResult) {
      return;
    }

    /**
     * SR at times returns the results with a starting space.
     * This ensures is just the words the user said that are taken into account.
     */
    return {
      result: fuzzyMatchingResult.trim(),
      match: fuzzyMatch,
    };
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
    const movieTitleCallback = () => {
      const { status } = this.state;

      if (status !== GameStatus.GUESSING) {
        return;
      }

      this.handleMatch();
    }

    annyang.addCommands({ [currentMovieTitle.toLocaleLowerCase()]: movieTitleCallback } as AnnyangCommands);

    if (currentQuestionIndex >= 1) {
      const { title: previousMovieTitle } = this.props.questionnaire[currentQuestionIndex].movie;
      annyang.removeCommands(previousMovieTitle);
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
      shouldShowHint: false,
      currentPosterPosition: undefined,
    });
  }

  handleStart = () => {
    /**
     * Since we attempt to restart annyang when it might be no longer listening
     * (because of SR things) `onStart` event could be triggered again and make the
     * countdown appear halfway through the game.
     * This is to avoid that problem, if the user is already playing, then this event
     * does nothing.
     */
    this.setState({
      status: GameStatus.STARTING,
    }, () => {
      annyang.removeCallback('start');
    });
  }

  handleGuessRequest = () => {
    this.setState({
      status: GameStatus.GUESSING,
    });
  }

  handleOptionsRequest = () => {
    /**
     * If the hint is being displayed, the user cannot see the options.
     */
    if (this.state.shouldShowHint) {
      return;
    }

    this.setState({
      shouldShowOptions: true,
    });

    ReactGA.event({
      category: 'Playing events',
      action: 'Show options',
    });
  }

  handlePass = () => {
    this.handleNoMatch();
  }

  handleCurse = () => {
  }

  handleNoMatch = (results?: any) => {
    /**
     * This is to prevent that user's voice gets picked up after he's answered the last
     * question. This prevents random audio being taken and the game attempting to go
     * to the next question when there's not one.
     */
    if (this.state.status !== GameStatus.GUESSING) {
      return;
    }

    const fuzzyMatch = this.getFuzzyMatch(results);

    /**
     * This makes the game a bit more forgiving on what comes to full movie titles or accents not being fully understandable by SR.
     * If the actual movie title matches in a MATCH_THRESHOLD percentage with what the user says, then the guess is considered correct.
     */
    if (fuzzyMatch) {
      const { match } = fuzzyMatch;

      if (match && match.length && match[0] >= MATCH_THRESHOLD) {
        this.handleMatch();
        return;
      }

      if (!this.state.shouldShowHint) {
        this.showHint();
        return;
      }
    }

    const { questionnaire } = this.props;
    const { currentQuestionIndex } = this.state;

    const currentMovie = questionnaire[currentQuestionIndex].movie;
    const result: Result = {
      isCorrect: false,
      spokenAnswer: [results],
      movie: currentMovie,
    }

    ReactGA.event({
      category: 'Playing events',
      action: 'Incorrect guess',
      label: currentMovie.title,
    });

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

    ReactGA.event({
      category: 'Playing events',
      action: 'Correct guess',
      label: currentMovie.title,
    });

    this.resumeGame(result);
  }

  onSelect = (answer: Answer) => {
    const { currentQuestionIndex } = this.state;
    const { questionnaire } = this.props;
    const currentQuestion = questionnaire[currentQuestionIndex];
    const isCorrect = answer.id === currentQuestion.movie.id;
    const result : Result = {
      isCorrect,
      answer,
      movie: currentQuestion.movie,
    };

    ReactGA.event({
      category: 'Playing events',
      action: 'Option selection',
      label: `${currentQuestion.movie.title}, user selected ${answer.label}`,
    });

    this.resumeGame(result);
  }

  handlePermissionBlocked = () => {
    ReactGA.event({
      category: 'Error',
      action: 'Permission to access microphone blocked by browser.',
    });

    this.setState({
      status: GameStatus.FAILED,
      error: GameError.BROWSER_DENIAL
    });
  }

  handlePermissionDenied = () => {
    ReactGA.event({
      category: 'Error',
      action: 'Permission to access microphone blocked by user.',
    });

    this.setState({
      status: GameStatus.FAILED,
      error: GameError.USER_DENIAL,
    });
  }

  renderError = () => {
    const { error } = this.state;

    let message = [
      <p>An unexpected error ocurred. As an alternative try the latest Chrome on desktop or Android.</p>,
    ];

    if (error === GameError.BROWSER_DENIAL) {
      message = [
        <p>The browser did not authorize the page to use the microphone.</p>,
        <p>Have a look at your settings or try the latest Chrome on Android or desktop.</p>,
      ];
    }

    if (error === GameError.USER_DENIAL) {
      message = [
        <p>The application is driven through speech, permission to microphone is required.</p>,
        <p>Please, enable microphone for this website and reload the page to start the game.</p>,
      ];
    }

    if (error === GameError.UNSUPPORTED) {
      message = [
        <p>It seems that your browser doesn't support SpeechRecognition.</p>,
        <p>Please try on the latest Chrome on desktop or Android or check <a href="https://caniuse.com/#feat=speech-recognition" target="blank">caniuse</a> for more info.</p>
      ];
    }

    return (
      <div className="Container u-textCenter">
        <h1 className="h3 u-mT-lg u-textCenter">Guess the Movie!</h1>
        <hr />
        <Notification classes="u-mT-lg">{message}</Notification>
      </div>
    );
  }

  startGame = () => {
    this.setState({
      status: GameStatus.PLAYING,
    }, () => {
      ReactGA.event({
        category: 'App events',
        action: 'Game started',
      });
    });
  }

  updateTimeLeft = (timeLeft: number) => {
    this.timeLeft = timeLeft;
  }

  finishGame = () => {
    annyang.abort();

    const { questionnaire } = this.props;
    const { results } = this.state;

    /**
     * Ensures that there's an answer for every question.
     */
    if (Object.keys(results).length < questionnaire.length) {
      questionnaire.forEach(({ movie } : { movie: Movie }) => {
        if (!results[movie.id]) {
          results[movie.id] = {
            isCorrect: false,
            movie,
          } as Result;
        }
      });
    }

    this.setState({
      status: GameStatus.FINISHED,
      results,
    }, () => {
      ReactGA.event({
        category: 'App events',
        action: 'Game finished',
      });
    });
  }

  createHint = () => {
    const { currentQuestionIndex } = this.state;
    const { questionnaire } = this.props;
    const currentQuestion = questionnaire[currentQuestionIndex];
    const { title: currentMovieTitle } = currentQuestion.movie;
    const currentMovieTitleAsArray = currentMovieTitle.split('');
    const totalLettersToReplace = Math.ceil(currentMovieTitle.length * HINT_PERCENT_TO_REPLACE / 100);
    const lettersIndexesReplaced: number[] = [];


    for (let i = 0; i < totalLettersToReplace; i++) {
      let letterIndexToReplace = generateRandomNumberFromRange(currentMovieTitle.length - 1, 0);
      let characterToReplace = currentMovieTitle.charAt(letterIndexToReplace);

      /**
       * To ensure that the same character is not attempted to be replaced twice, the right amount of letters are replaced
       * and only HINT_REPLACEABLE_CHARACTERS are being replaced with the HINT_CHARATER
       */
      while (lettersIndexesReplaced.indexOf(letterIndexToReplace) !== -1 || !HINT_REPLACEABLE_CHARACTERS.test(characterToReplace)) {
        letterIndexToReplace = generateRandomNumberFromRange(currentMovieTitle.length - 1, 0);
        characterToReplace = currentMovieTitle.charAt(letterIndexToReplace);
      }

      currentMovieTitleAsArray[letterIndexToReplace] = HINT_CHARACTER;
    }

    return `${currentMovieTitleAsArray.join('')}`;
  }

  showHint = () => {
    const hint = this.createHint();

    this.setState({
      shouldShowHint: true,
      shouldShowOptions: false,
      hint,
    });
  }


  reset = () => {
    const { getMovies } = this.props;

    getMovies();

    ReactGA.event({
      category: 'App events',
      action: 'Try again',
    });

    this.setState(RESET_STATE);
  }

  componentDidUpdate() {
    const { questionnaire } = this.props;
    const { currentQuestionIndex, status } = this.state;

    if (currentQuestionIndex === 0 && questionnaire.length > 0) {
      const titles = questionnaire.map((question: Question) => question.movie.title)
      this.fuzzy = FuzzySet(titles);
    }

    if (status === GameStatus.STARTING || !annyang.isListening()) {
      annyang.start();
    }

    if (status !== GameStatus.PLAYING) {
      return;
    }

    if (questionnaire.length > currentQuestionIndex) {
      this.updateMoviesOnCommands();
    }
  }

  componentDidMount() {
    const { status } = this.state;

    /**
     * No need to fetch movies in this case.
     */
    if (status === GameStatus.FAILED) {
      return;
    }

    const { getMovies } = this.props;

    getMovies();
  }

  render() {
    const { status } = this.state;

    if (status === GameStatus.FAILED) {
      return this.renderError();
    }

    if (status === GameStatus.AUTHORIZING) {
      return (
        <div className="Container u-textCenter">
          <h1 className="h3 u-mT-lg u-textCenter">Guess the Movie!</h1>
          <hr />
          <Notification>
            <h4 className="u-mT-lg">This game uses Speech Recognition for playing.</h4>
            <p>Please allow the microphone to be used on this page to start the game.</p>
          </Notification>
        </div>
      );
    }

    if (status === GameStatus.STARTING) {
      return (
        <div className="Container u-textCenter">
          <h1 className="h3 u-mT-lg u-textCenter">Guess the Movie!</h1>
          <hr />
          <Notification>
            <h4 className="u-mT-lg">Get Ready!</h4>
            <Timer
              time={COUNTDOWN_TIME}
              onTimeUp={this.startGame}
              unformatted={true}
              classes="h1 u-mB-0 u-textSuccess"
              />
          </Notification>
        </div>
      )
    }

    const { isLoadingMovies } = this.props;

    if (isLoadingMovies) {
      return (
        <Notification>
          <p>Loading...</p>
        </Notification>
      )
    }

    const { questionnaire } = this.props;

    if (!questionnaire.length) {
      return (
        <Notification>
          <p>Sorry, the <a href="https://developers.themoviedb.org/4/getting-started/authorization" target="blank">Moviedatabase API</a> seems to not be working currently</p>
          <p>Please try again later.</p>
        </Notification>
      );
    }

    const { currentQuestionIndex, currentPosterPosition, hint, shouldShowOptions, shouldShowHint } = this.state;
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

    const { results } = this.state;

    if (status === GameStatus.FINISHED) {
      return (
        <div className="Container">
          <h1 className="h3 u-mT-lg u-textCenter">Guess the Movie!</h1>
          <hr />
          <Feedback
            questionnaire={questionnaire}
            currentQuestionIndex={currentQuestionIndex}
            results={results}
          />
          <button className="Button Button--primary u-textCenter" onClick={this.reset}>Try again!</button>
        </div>
      );
    }

    return (
      <div className="Container">
        <h1 className="h3 u-mT-lg u-textCenter">Guess the Movie!</h1>
        <hr />
        <div className="Grid u-mT-md u-mB-md">
          <div className="Grid-cell u-width1of2 u-textCenter">
            <h4 className="u-textBold u-mB-sm">
              <span className="icon icon-time"></span>
              <span className="u-hiddenVisually">Time</span>
            </h4>
            <Timer
              classes="h5 u-mB-0"
              time={GAME_TIME}
              onTimeUp={this.finishGame}
              timeRunningOutClassesThreshold={10}
              timeRunningOutClasses='u-textError u-textFlash u-textBold'
            />
          </div>
          <div className="Grid-cell u-width1of2 u-textCenter">
            <h4 className="u-textBold u-mB-sm">
              <span className="icon icon-question"></span>
              <span className="u-hiddenVisually">Question</span>
            </h4>
            <p className="h5 u-mB-0">{currentQuestionIndex + 1}/{questionnaire.length}</p>
          </div>
        </div>

        <hr />

        <div className="Grid u-mT-md u-mB-md u-flex u-flexAlignItemsStretch">
          <div className="Grid-cell u-md-width2of3">
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
          </div>
          <div className="Grid-cell u-md-width1of3">
            <Feedback
              questionnaire={questionnaire}
              currentQuestionIndex={currentQuestionIndex}
              results={results}
            />
          </div>
        </div>

        <hr className="u-mT-md u-mB-md" />

        {status === GameStatus.GUESSING && (<h4 className="u-textCenter">Take a guess now!</h4>)}
        {status !== GameStatus.GUESSING && (<h4 className="u-textCenter">Say "{ENABLE_GUESSING_COMMAND}" when you are ready to take a guess.</h4>)}
        {!shouldShowHint && <h4 className="u-textCenter">If you need help, just say "show options"</h4>}

        {shouldShowHint && (
          <div className="Alert Alert--info">
            <h5 className="u-mB-0 Alert-icon">
              <span className="icon icon-hint"></span>
            </h5>
            <p className="u-mB-0"><strong>Hint: </strong><span className="hint">{hint}</span></p>
          </div>
        )}

        {shouldShowOptions && (
          <AnswerList
            answers={currentQuestion.answers}
            onSelect={this.onSelect}
          />
        )}
      </div>
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