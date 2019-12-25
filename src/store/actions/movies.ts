export const GET_MOVIES = 'GET_MOVIES';
export const GET_MOVIES_SUCCESS = 'GET_MOVIES_SUCCESS';
export const GET_MOVIES_FAIL = 'GET_MOVIES_FAIL';

export const MOVIES_TYPES = {
  GET_MOVIES,
  GET_MOVIES_SUCCESS,
  GET_MOVIES_FAIL,
};

export const getMovies = () => {
  return {
    type: GET_MOVIES,
  };
};
