import { all } from 'redux-saga/effects'
import { example } from "./sagas/example";

export default function* rootSaga() {
  yield all([
    example(),
  ]);
};
