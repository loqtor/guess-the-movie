import * as React from 'react';
import * as Redux from 'redux';

import { connect } from "react-redux";

import { getMovies } from "../store/selectors/movies";
import { getMovies as getMoviesAction } from "../store/actions/movies";

import { Link } from 'react-router-dom';
import { RootState } from '../store/reducers';
import { Movie } from '../store/reducers/movies';

export interface OwnProps {}

interface StateProps {
  movies: Movie[];
}
     
interface DispatchProps {
  getMovies: () => void
}
 
type Props = StateProps & DispatchProps & OwnProps;

class ExampleComponent extends React.Component<Props, {}> {
  render() {
    const { movies, getMovies } = this.props;

    return (
      <>
        <h1>This is an example extra route.</h1>
        <p>This is where we'll show the movies</p>
        {movies && movies.length > 0 && (
          movies.map((movie: Movie) => (<p>{movie.title}</p>))
        )}
        <button onClick={getMovies}>Click to request more movies!</button>
        <Link to="/">Back to home</Link>
      </>
    )
  }
}
 
function mapStateToProps(state: RootState): StateProps {
  return {
    movies: getMovies(state),
  };
}
 
function mapDispatchToProps(dispatch: Redux.Dispatch<any>): DispatchProps {
  return {
    getMovies: () => {
      return dispatch(getMoviesAction());
    },
  };
}
  
export const Example = connect<StateProps, any, Props, any>
  (mapStateToProps, mapDispatchToProps)(ExampleComponent)