import { RootState } from "../reducers";
import { MOVIES_PER_GAME } from "../../constants/config";
import { generateRandomNumberFromRange } from "../../tools/util";
import { Movie } from "../reducers/movies";

export const isLoadingMovies = (state: RootState) => state.movies.isLoadingMovies;

// Gets ten random movies out of the response from a randome page in the API
export const getMovies = (state: RootState) => {
  const { movies: { movies } } = state;

  if (!movies.length) {
    return [];
  }

  const usedIndexes: number[] = [];
  const moviesForGame: Movie[] = [];

  while (moviesForGame.length < MOVIES_PER_GAME) {
    let newMovieIndex = generateRandomNumberFromRange(moviesForGame.length, 0);

    while (usedIndexes.indexOf(newMovieIndex) !== -1) {
      newMovieIndex = generateRandomNumberFromRange(moviesForGame.length, 0);
    }

    moviesForGame.push(movies[newMovieIndex]);
  }

  return moviesForGame;
};

// export const getMovies = (state: RootState) => state.movies.movies;
export const getExtraMovies = (state: RootState) => state.movies.extraMovies;