import React from 'react';
import { Dispatch } from 'redux';

import { connect } from "react-redux";

import { getMovies, isLoadingMovies } from "../store/selectors/movies";
import { getMovies as getMoviesAction } from "../store/actions/movies";

import { RootState } from '../store/reducers';
import { Movie } from '../store/reducers/movies';

import { IMAGE_BASE_URL } from "../constants/config";

export interface OwnProps {}

interface StateProps {
  movies: Movie[];
  isLoadingMovies: boolean;
}
     
interface DispatchProps {
  getMovies: () => void;
}
 
type Props = StateProps & DispatchProps & OwnProps;

class GameComponent extends React.Component<Props, {}> {
  componentDidMount() {
    const { getMovies } = this.props;

    getMovies();
  }

  render() {
    const { isLoadingMovies, movies } = this.props;


    if (isLoadingMovies) {
      return (
        <p>Loading...</p>
      )
    }

    if (!movies.length) {
      return (
        <p>Sorry, the movies API is not currently working.</p>
      );
    }

    return (
      <>
        <h1>This is where the game will happen.</h1>
        <p>This is where we'll show the movies</p>
        {movies && movies.length > 0 && (
          movies.map((movie: Movie) => (
            <>
              <p key={`title-${movie.id}`}>{movie.title}</p>
              <img key={`image-${movie.id}`} style={{maxWidth: '200px'}} src={`${IMAGE_BASE_URL}${movie.poster_path}`}/>
              <img key={`backdrop-${movie.id}`} style={{maxWidth: '200px'}} src={`${IMAGE_BASE_URL}${movie.backdrop_path}`}/>
            </>
          ))
        )}
        
      </>
    )
  }
}
 
function mapStateToProps(state: RootState): StateProps {
  return {
    movies: getMovies(state),
    isLoadingMovies: isLoadingMovies(state),
  };
}
 
function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
  return {
    getMovies: () => dispatch(getMoviesAction()),
  };
}
  
export const Game = connect<StateProps, any, Props, any>
  (mapStateToProps, mapDispatchToProps)(GameComponent)