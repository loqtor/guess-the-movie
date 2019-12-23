import { takeEvery, put, call } from "redux-saga/effects";
import { MOVIES_TYPES } from "../actions/movies";
import { Movie } from "../reducers/movies";

import { getMovies as getMoviesApi } from "../api/movies";

// The movie search will happen randomically per page.
// This number is the max page that will be considered.
const MAX_PAGE = 20;
const MIN_PAGE = 1;

function* getMovies() {
  const page = Math.floor(Math.random() * (MAX_PAGE - MIN_PAGE + 1)) + MIN_PAGE;

  try {
    const movies: Movie[] = yield call(getMoviesApi, page);
    yield put({ type: MOVIES_TYPES.GET_MOVIES_SUCCESS, payload: { movies } });
  } catch (error) {
    
  }
}

export function* movies() {
  yield takeEvery(MOVIES_TYPES.GET_MOVIES, getMovies);
};