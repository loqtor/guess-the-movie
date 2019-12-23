import { takeEvery } from "redux-saga/effects";
import { EXAMPLE_TYPES } from "../actions/example";

const exampleFunction = () => {
  console.log('At the example function, yes.');
}

export function* example() {
  yield takeEvery(EXAMPLE_TYPES.COUNT_CLICK, exampleFunction);
};