import { MOVIES_TYPES } from "../actions/movies";

export type Movie = {
  popularity: number,
  vote_count: number,
  video: string,
  poster_path: string,
  id: string,
  adult: boolean,
  backdrop_path: string,
  original_language: string,
  original_title: string,
  genre_ids: number[],
  title: string,
  vote_average: number,
  overview: string,
  release_date: string, // format YYYY-MM-DD
}

export type MoviesState = {
  movies: Movie[];
  extraMovies: Movie[]; // To give options as a response that do not clash with actual answers
  isLoadingMovies: boolean;
  error: string | null;
}

const initialState: MoviesState = {
  movies: [],
  extraMovies: [],
  isLoadingMovies: false,
  error: null,
};

export const movies = (state = initialState, action: { payload: MoviesState, type: any }) => {
  switch (action.type) {
    case MOVIES_TYPES.GET_MOVIES: 
      return {
        ...state,
        isLoadingMovies: true,
      };
    case MOVIES_TYPES.GET_MOVIES_SUCCESS:
      return {
        ...state,
        isLoadingMovies: false,
        movies: action.payload.movies,
        extraMovies: action.payload.extraMovies,
      };
    case MOVIES_TYPES.GET_MOVIES_FAIL:
      return {
        ...state,
        isLoadingMovies: false,
        error: action.payload.error,
      };

    default:
      return state;
  }
};  