export enum GameStatus {
  AUTHORIZING = 'authorizing',
  STARTING = 'starting',
  PLAYING = 'playing',
  GUESSING = 'guessing',
  FINISHED = 'finished',
  FAILED = 'failed',
};

export enum GameError {
  BROWSER_DENIAL = 'browser-denial',
  USER_DENIAL = 'user-denial',
  UNSUPPORTED = 'unsupported',
  UNEXPECTED = 'unexpected',
}
