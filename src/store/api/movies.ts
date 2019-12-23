import { makeRequest } from "../../tools/util"

const API_URL = 'https://api.themoviedb.org/4/discover/movie';
const TOKEN = process.env.REACT_APP_API_TOKEN;
const HEADERS = new Headers();
HEADERS.append('Authorization', TOKEN ? `Bearer ${TOKEN}` : '');

export const getMovies = (page: number) => 
  makeRequest(`${API_URL}?page=${page}`, { headers: HEADERS });