import { RootState } from "../reducers";

export const getMovies = (state: RootState) => {
  return state.movies.movies;
};