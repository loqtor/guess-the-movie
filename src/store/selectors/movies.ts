import { RootState } from "../reducers";
import { shuffleArray } from "../../tools/util";
import { Answer } from "../../components/game/AnswerList";
import { Movie } from "../reducers/movies";
import { MOVIES_PER_GAME } from "../../constants/config";

export type Question = {
  movie: Movie;
  answers: Answer[];
}

export const isLoadingMovies = (state: RootState) => state.movies.isLoadingMovies;
export const getMovies = (state: RootState) => state.movies.movies;

// export const getMovies = (state: RootState) => state.movies.movies;
export const getExtraMovies = (state: RootState) => state.movies.extraMovies;

// Gets ten random movies out of the response from a random page in the API
export const getQuestionnaire = (state: RootState) => {
  const { movies: { movies, extraMovies } } = state;

  if (!movies.length || !extraMovies.length) {
    return [];
  }

  const getQuestionnaire: Question[] = [];
  const shuffledMovies = shuffleArray(movies).slice(0, MOVIES_PER_GAME);
  const shuffledExtraMovies = shuffleArray(extraMovies);
  const extraMoviesIndexes = [0, 1];

  shuffledMovies.forEach((movie: Movie, index: number) => {
    const rightMovie = movies[index];
    const rightAnswer: Answer = {
      label: rightMovie.title,
      id: rightMovie.id,
      isCorrect: true,
    };
  
    const wrongMovie1 = shuffledExtraMovies[extraMoviesIndexes[0]];
    const wrongMovie2 = shuffledExtraMovies[extraMoviesIndexes[1]];
    const wrongAnswer1 = {
      label: wrongMovie1.title,
      id: wrongMovie1.id,
    };
    const wrongAnswer2 = {
      label: wrongMovie2.title,
      id: wrongMovie2.id,
    };
    const answersForQuestion = [rightAnswer, wrongAnswer1, wrongAnswer2];
    const shuffledAnswersForQuestion = shuffleArray(answersForQuestion);

    getQuestionnaire.push({
      movie,
      answers: shuffledAnswersForQuestion,
    });
    
    // So we ensure that every question has different options.
    extraMoviesIndexes[0] = extraMoviesIndexes[0] + 2;
    extraMoviesIndexes[1] = extraMoviesIndexes[1] + 2;
  });

  return getQuestionnaire;
};