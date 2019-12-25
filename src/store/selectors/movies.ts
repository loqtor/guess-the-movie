import { RootState } from "../reducers";

export const isLoadingMovies = (state: RootState) => state.movies.isLoadingMovies;
export const getMovies = (state: RootState) => state.movies.movies;