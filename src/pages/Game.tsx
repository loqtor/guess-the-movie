import React from 'react';
import { Dispatch } from 'redux';
import { connect } from "react-redux";

import { getMovies, isLoadingMovies, getExtraMovies } from "../store/selectors/movies";
import { getMovies as getMoviesAction } from "../store/actions/movies";

import { RootState } from '../store/reducers';
import { Movie } from '../store/reducers/movies';

import { IMAGE_BASE_URL, IMAGE_WIDTH } from "../constants/config";
import { Timer } from '../components/game/Timer';
import { GameStatus } from '../constants/game';
import { PhotoCropper } from '../components/game/PhotoCropper';
import { Gallery } from '../components/Gallery';

export interface OwnProps {}

interface OwnStateProps {
  status: GameStatus;
  currentMovie: number;
  extraMovies: number[];
}

interface StateProps {
  movies: Movie[];
  extraMovies: Movie[];
  isLoadingMovies: boolean;
}
     
interface DispatchProps {
  getMovies: () => void;
}
 
type Props = StateProps & DispatchProps & OwnProps;

class GameComponent extends React.Component<Props, OwnStateProps> {
  constructor(props: Props) {
    super(props);

    this.state = {
      status: GameStatus.PLAYING,
      currentMovie: 0,
      extraMovies: [0, 1],
    };
  }

  componentDidMount() {
    const { getMovies } = this.props;

    getMovies();
  }

  onStart = (evt: any) => {
    console.log('onStart evt: ', evt);
    debugger;
  }

  onResult = (evt: any) => {
    console.log('onResult evt: ', evt);
    debugger;
  }

  onError = (evt: any) => {
    console.log('onError evt: ', evt);
    debugger;
  }

  finishGame = () => {
    this.setState({
      status: GameStatus.FINISHED,
    });
  }

  render() {
    const { status } = this.state;

    if (status === GameStatus.FINISHED) {
      return (<p>Time's up!</p>);
    }

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
        <Timer time={10000} onTimeUp={this.finishGame} />
        <Gallery>
          {movies && movies.length > 0 && (
            movies.map((movie: Movie) => (
              <>
                <p key={`title-${movie.id}`}>{movie.title}</p>
                <PhotoCropper 
                  key={`image-${movie.id}`} 
                  imageUrl={`${IMAGE_BASE_URL}${movie.poster_path}`}
                  expectedImageWidth={IMAGE_WIDTH}
                />
              </>
            ))
          )}
        </Gallery>
        
      </>
    )
  }
}
 
function mapStateToProps(state: RootState): StateProps {
  return {
    movies: getMovies(state),
    extraMovies: getExtraMovies(state),
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