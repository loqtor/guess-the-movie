import React, { useState, useEffect, useCallback } from 'react';
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

export interface Result {
  movie: Movie;
  answer?: Answer;
  spokenAnswer?: string[];
  isCorrect: boolean;
}

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

const COUNTDOWN_TIME = 3; // seconds
const FUZZY_MATCH_THRESHOLD = 0.2; // Percentage of coincidence between result and what the movie title is.
const MATCH_THRESHOLD = 0.8;
const HINT_PERCENT_TO_REPLACE = 20; // Percentage of the subtitle to be displayed when showing a hint.
const HINT_CHARACTER = '_';
const HINT_REPLACEABLE_CHARACTERS = /^[a-zA-Z0-9]+$/; // Only Alphanumeric characters are to be replaced for hints.

export const Game = () => {
  const dispatch = useDispatch();
  const questionnaire = useSelector(getQuestionnaire);
  const isLoading = useSelector(isLoadingMovies);

  const resolveStatus = () => {
    if (!annyang) {
      return GameStatus.FAILED;
    }

    if (questionnaire && questionnaire.length) {
      return GameStatus.PLAYING;
    }

    return GameStatus.AUTHORIZING;
  };

  const [status, setStatus] = useState<GameStatus>(resolveStatus());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [currentPosterPosition, setCurrentPosterPosition] = useState<any>(null);
  const [results, setResults] = useState<{[keyof: string]: Result}>({});
  const [hint, setHint] = useState<string>('');
  const [shouldShowHint, setShouldShowHint] = useState<boolean>(false);
  const [shouldShowOptions, setShouldShowOptions] = useState<boolean>(false);
  const [fuzzy, setFuzzy] = useState<any>();
  const [error, setError] = useState<GameError | null>(!annyang ? GameError.UNSUPPORTED : null);

  const createHint = useCallback(() => {
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
  }, [currentQuestionIndex, questionnaire]);

  const resumeGame = useCallback((result: Result) => {
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
  }, [currentQuestionIndex, questionnaire.length, results]);

  const handleMatch = useCallback(() => {
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
  }, [currentQuestionIndex, questionnaire, resumeGame]);

  const getFuzzyMatch = useCallback((results: string[]) => {
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
  }, [currentQuestionIndex, fuzzy, questionnaire]);

  const handleNoMatch = useCallback((results?: any) => {
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
        handleMatch();
        return;
      }

      if (!shouldShowHint) {
        setHint(createHint());
        setShouldShowHint(true);
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
  }, [status, getFuzzyMatch, questionnaire, currentQuestionIndex, resumeGame, shouldShowHint, handleMatch, createHint]);

  const onSelect = useCallback((answer: Answer) => {
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

    resumeGame(result);
  }, [currentQuestionIndex, questionnaire, resumeGame]);

  const handleShowOptions = useCallback(() => {
    /**
     * If the hint is being displayed, the user cannot see the options.
     */
    if (shouldShowHint) {
      return;
    }

    setShouldShowOptions(true);

    ReactGA.event({
      category: 'Playing events',
      action: 'Show options',
    });
  }, [shouldShowHint]);

  const handleStart = useCallback(() => {
    /**
     * Since we attempt to restart annyang when it might be no longer listening
     * (because of SR things) `onStart` event could be triggered again and make the
     * countdown appear halfway through the game.
     * This is to avoid that problem, if the user is already playing, then this event
     * does nothing.
     */
    setStatus(GameStatus.STARTING);
    annyang.removeCallback('start');
  }, []);

  const handlePermissionBlocked = useCallback(() => {
    ReactGA.event({
      category: 'Error',
      action: 'Permission to access microphone blocked by browser.',
    });

    setStatus(GameStatus.FAILED);
    setError(GameError.BROWSER_DENIAL);
  }, [])

  const handlePermissionDenied = useCallback(() => {
    ReactGA.event({
      category: 'Error',
      action: 'Permission to access microphone blocked by user.',
    });

    setStatus(GameStatus.FAILED);
    setError(GameError.USER_DENIAL);
  }, []);

  const resetGame = () => {
    setCurrentQuestionIndex(0);
    setStatus(GameStatus.STARTING);
    setResults({});
    setShouldShowHint(false);
    setShouldShowOptions(false);
  }

  if (status === GameStatus.AUTHORIZING) {
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
        callback: handleShowOptions,
      },
    };
  
    const annyangFormattedCommands = formatForAnnyang(COMMANDS);
  
    annyang.addCommands(annyangFormattedCommands);
  
    annyang.addCallback('start', handleStart);
    annyang.addCallback('errorPermissionBlocked', handlePermissionBlocked);
    annyang.addCallback('errorPermissionDenied', handlePermissionDenied);
    annyang.addCallback('resultNoMatch', handleNoMatch);
  
    annyang.start();
  
    if (!fuzzy) {
      const titles = questionnaire.map((question: Question) => question.movie.title)
      setFuzzy(FuzzySet(titles));
    }
  }

  useEffect(() => {
    if (status === GameStatus.PLAYING && !annyang.isListening()) {
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

  const finishGame = () => {
    annyang.abort();
    
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

    setResults(results);
    setStatus(GameStatus.FINISHED);
    
    ReactGA.event({
      category: 'App events',
      action: 'Game finished',
    });
  }

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
            onTimeUp={() => {
              dispatch(getMoviesAction());
              setStatus(GameStatus.PLAYING)
            }}
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
        <button className="Button Button--primary u-textCenter" onClick={resetGame}>Try again!</button>
      </div>
    );
  }

  const currentQuestion = questionnaire[currentQuestionIndex];
  let photoCropperProps: any = {
    expectedImageWidth: IMAGE_WIDTH,
    onMounted: (currentPosterPosition: ImagePosition) => setCurrentPosterPosition(currentPosterPosition),
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
            onTimeUp={finishGame}
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
          onSelect={onSelect}
        />
      )}
    </div>
  );
};
