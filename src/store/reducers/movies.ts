import { MOVIES_TYPES } from "../actions/movies";

export type Movie = {
  title: string;
}

export type MoviesState = {
  movies: Movie[];
  loadingMovies: boolean;
}

const initialState: MoviesState = {
  movies: [],
  loadingMovies: false,
};

export const movies = (state = initialState, action: { payload: { movies: Movie[], error: string }, type: any }) => {
  switch (action.type) {
    case MOVIES_TYPES.GET_MOVIES: 
      return {
        ...state,
        loadingMovies: true,
      };
    case MOVIES_TYPES.GET_MOVIES_SUCCESS:
      return {
        ...state,
        loadingMovies: false,
        movies: action.payload.movies,
      };
    case MOVIES_TYPES.GET_MOVIES_FAIL:
      return {
        ...state,
        loadingMovies: false,
        error: action.payload.error,
      };

    default:
      return state;
  }
};  