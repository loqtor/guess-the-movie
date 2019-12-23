import { MOVIES_TYPES } from "../actions/movies";

export type Movie = {
  title: string;
}

export type MoviesState = {
  movies: Movie[];
}

const initialState: MoviesState = {
  movies: [],
};

export const movies = (state = initialState, action: { payload: { movies: Movie[] }, type: any }) => {
  switch (action.type) {
    case MOVIES_TYPES.GET_MOVIES: 
      return {
        ...state,
        movies: action.payload.movies,
      };

    default:
      return state;
  }
};  