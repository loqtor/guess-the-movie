export enum GameStatus {
  STARTING = 'starting',
  PLAYING = 'playing',
  FINISHED = 'finished',
  FAILED = 'failed',
};

export enum GameError {
  BROWSER_DENIAL = 'browser-denial',
  USER_DENIAL = 'user-denial',
  UNSUPPORTED = 'unsupported',
  UNEXPECTED = 'unexpected',
}
