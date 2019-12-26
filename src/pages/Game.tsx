import React from 'react';
import { Dispatch } from 'redux';
import { connect } from "react-redux";

import { SpeechRecognizer } from 'speech-recognizer';

import { getMovies, isLoadingMovies } from "../store/selectors/movies";
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
}

interface StateProps {
  movies: Movie[];
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
        <SpeechRecognizer
          startSpeechRecognition={true}
          onResult={this.onResult}
          onStart={this.onStart}
          onError={this.onError}
        />
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