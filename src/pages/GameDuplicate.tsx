import React, { useState, useEffect } from 'react';
import ReactGA from 'react-ga';
import { useSelector, useDispatch } from 'react-redux';
import FuzzySet from 'fuzzyset.js';

import { isLoadingMovies, getQuestionnaire, Question } from '../store/selectors/movies';
import { getMovies as getMoviesAction } from '../store/actions/movies';

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
import { formatForAnnyang } from '../tools/game';

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

export interface Command {
  phrases: string[];
  callback: () => void;
}

interface AnnyangOptions {
  autorestart: boolean;
  continuous: boolean;
  paused: boolean;
}

export interface AnnyangCommands {
  [keyof: string]: () => void;
}

interface Annyang {
  start: (options?: AnnyangOptions) => void;
  abort: () => void;
  addCommands: (commands: AnnyangCommands) => void;
  removeCommands: (command: string) => void;
  removeCallback: (type: string, callback?: () => {}) => void;
  addCallback: (event: string, callback: () => void) => void;
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

export const GameRefactor = () => {
  const dispatch = useDispatch();
  const questionnaire = useSelector(getQuestionnaire);
  const isLoading = useSelector(isLoadingMovies);

  const [status, setStatus] = useState<GameStatus>(!annyang ? GameStatus.FAILED : GameStatus.AUTHORIZING);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [currentPosterPosition, setCurrentPosterPosition] = useState<any>(null);
  const [results, setResults] = useState<any>({});
  const [hint, setHint] = useState<string>('');
  const [shouldShowHint, setShouldShowHint] = useState<boolean>(false);
  const [shouldShowOptions, setShouldShowOptions] = useState<boolean>(false);
  const [fuzzy, setFuzzy] = useState<any>();
  const [error, setError] = useState<any>(!annyang ? GameError.UNSUPPORTED : null);

  const getFuzzyMatch = (results: string[]) => {
    if (!results || !results.length) {
      return false;
    }

    let fuzzyMatch: [number, string] = [0, ''];
    const { title: currentMovieTitle } = questionnaire[currentQuestionIndex].movie;
    const fuzzyMatchingResult = results.find((result: string) => {
      const matches = fuzzy?.get(result);

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

  const handleNoMatch = (results?: any) => {
    /**
     * This is to prevent that user's voice gets picked up after he's answered the last
     * question. This prevents random audio being taken and the game attempting to go
     * to the next question when there's not one.
     */
    if (status !== GameStatus.PLAYING) {
      return;
    }

    const fuzzyMatch = getFuzzyMatch(results);

    /**
     * This makes the game a bit more forgiving on what comes to full movie titles or accents not being fully understandable by SR.
     * If the actual movie title matches in a MATCH_THRESHOLD percentage with what the user says, then the guess is considered correct.
     */
    if (fuzzyMatch) {
      const { match } = fuzzyMatch;

      if (match && match.length && match[0] >= MATCH_THRESHOLD) {
        // handleMatch();
        console.log('We would handle the match here.');
        return;
      }

      if (!shouldShowHint) {
        // showHint();
        console.log('We would show the hint here.');
        return;
      }
    }

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

    resumeGame(result);
  }

  const handleMatch = () => {
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

    resumeGame(result);
  }

  const resumeGame = (result: Result) => {
    const newResult = { [result.movie.id]: result };
    const newResults = {...results, ...newResult};
    const nextIndex = currentQuestionIndex + 1;
    const isFinished = nextIndex >= questionnaire.length;

    setResults(newResults);
    setCurrentQuestionIndex(currentQuestionIndex  + 1);
    setStatus(isFinished ? GameStatus.FINISHED : GameStatus.PLAYING);
    setShouldShowOptions(false);
    setShouldShowHint(false);
    setCurrentPosterPosition(null);
  }

  useEffect(() => {
    if (status === GameStatus.STARTING) {
      dispatch(getMoviesAction());
    }

    if (status === GameStatus.PLAYING) {
      const COMMANDS : { [keyof: string]: Command }  = {
        PASS: {
          phrases: ['pass', 'next', 'don\'t know'],
          callback: handleNoMatch,
        },
        CURSE: {
          phrases: ['fuck', 'shit', 'motherfucker'],
          callback: () => console.log('Mate, watch your mouth!'),
        },
        OPTIONS: {
          phrases: ['show options'],
          callback: () => console.log('It\'s showing options'),
        },
      };
    
      const annyangFormattedCommands = formatForAnnyang(COMMANDS);
    
      annyang.addCommands(annyangFormattedCommands);
    
      annyang.addCallback('start', () => console.log('handling start'));
      annyang.addCallback('errorPermissionBlocked', () => console.log('handling permission bloked'));
      annyang.addCallback('errorPermissionDenied', () => console.log('handling permission denied'));
      annyang.addCallback('resultNoMatch', () => console.log('handling result not match'));

      annyang.start();

      if (!fuzzy) {
        const titles = questionnaire.map((question: Question) => question.movie.title)
        setFuzzy(FuzzySet(titles));
      }
    }
  }, [status, dispatch, handleNoMatch, fuzzy, questionnaire]);

  useEffect(() => {
    if (status === GameStatus.PLAYING && !annyang.isListening) {
      annyang.start();
    }
  }, [status]);

  useEffect(() => {
    if (!questionnaire.length) {
      return;
    }

    const { title: currentMovieTitle } = questionnaire[currentQuestionIndex].movie;

    annyang.addCommands({ [currentMovieTitle.toLocaleLowerCase()]: handleMatch } as AnnyangCommands);

    if (currentQuestionIndex >= 1) {
      const { title: previousMovieTitle } = questionnaire[currentQuestionIndex].movie;
      annyang.removeCommands(previousMovieTitle);
    }
  }, [currentQuestionIndex, handleMatch, questionnaire]);

  const renderError = () => {
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

  if (status === GameStatus.FAILED) {
    renderError();
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
            onTimeUp={() => console.log('It would start now.')}
            unformatted={true}
            classes="h1 u-mB-0 u-textSuccess"
            />
        </Notification>
      </div>
    )
  }

  if (isLoading) {
    return (
      <Notification>
        <p>Loading...</p>
      </Notification>
    )
  }

  if (!questionnaire.length) {
    return (
      <Notification>
        <p>Sorry, the <a href="https://developers.themoviedb.org/4/getting-started/authorization" target="blank">Moviedatabase API</a> seems to not be working currently</p>
        <p>Please try again later.</p>
      </Notification>
    );
  }

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
        <button className="Button Button--primary u-textCenter" onClick={() => console.log('The game would reset here.')}>Try again!</button>
      </div>
    );
  }

  const currentQuestion = questionnaire[currentQuestionIndex];
  let photoCropperProps: any = {
    expectedImageWidth: IMAGE_WIDTH,
    onMounted: () => console.log('Photo cropper has mounted'),
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
            onTimeUp={() => console.log('The game would finish here')}
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
          onSelect={() => console.log('The answer would be selected here')}
        />
      )}
    </div>
  );
};
