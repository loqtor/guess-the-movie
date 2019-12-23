import { takeEvery } from "redux-saga/effects";
import { MOVIES_TYPES } from "../actions/movies";

const getMovies = () => {
  console.log('At the get movies function, yes.');
}

export function* movies() {
  yield takeEvery(MOVIES_TYPES.GET_MOVIES, getMovies);
};