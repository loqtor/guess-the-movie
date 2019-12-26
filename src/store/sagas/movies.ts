import { takeEvery, put, call, all } from "redux-saga/effects";
import { MOVIES_TYPES } from "../actions/movies";

import { getMovies as getMoviesApi } from "../api/movies";
import { generateRandomNumberFromRange } from "../../tools/util";

// The movie search will happen randomically per page.
// This number is the max page that will be considered.
const MAX_PAGE = 20;
const MIN_PAGE = 1;

function* getMovies() {
  const page = generateRandomNumberFromRange(MAX_PAGE, MIN_PAGE);
  let extraOptionsPage = generateRandomNumberFromRange(MAX_PAGE, MIN_PAGE);

  // To ensure they are different
  while (extraOptionsPage === page) {
    extraOptionsPage = generateRandomNumberFromRange(MAX_PAGE, MIN_PAGE);
  }

  try {
    const [movies, extraMovies] = yield all([
      call(getMoviesApi, page),
      call(getMoviesApi, extraOptionsPage),
    ]);

    const payload = {
      movies: movies.results, // Just ten randomized movies to be asked.
      extraMovies: extraMovies.results, // 20 options to use as returned from the API
    };

    yield put({ type: MOVIES_TYPES.GET_MOVIES_SUCCESS, payload });
  } catch (error) {
    console.error('Error trying to get movies from the API: ', error);
    yield put({ type: MOVIES_TYPES.GET_MOVIES_FAIL, payload: { error } });
  }
}

export function* movies() {
  yield takeEvery(MOVIES_TYPES.GET_MOVIES, getMovies);
};