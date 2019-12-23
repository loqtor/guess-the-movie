import { combineReducers } from 'redux'
import { MoviesState, movies } from './reducers/movies';

export const RootReducer = combineReducers({
  movies,
});

export type RootState = {
  movies: MoviesState
};