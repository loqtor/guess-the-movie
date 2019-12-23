import { combineReducers } from 'redux'
import { ExampleState, example } from './reducers/example';

export const RootReducer = combineReducers({
  example,
});

export type RootState = {
  example: ExampleState
};