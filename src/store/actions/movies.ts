export const GET_MOVIES = 'GET_MOVIES';

export const MOVIES_TYPES = {
  GET_MOVIES,
};

export const getMovies = () => {
  return {
    type: GET_MOVIES,
  };
};