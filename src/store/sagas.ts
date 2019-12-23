import { all } from 'redux-saga/effects'
import { movies } from "./sagas/movies";

export default function* rootSaga() {
  yield all([
    movies(),
  ]);
};
