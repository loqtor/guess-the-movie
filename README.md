# Guess the Movie

Quiz game that can be played through speech. :)

Guess the movie from its poster.

## Why?

An experiment to test the Web Speech API's Speech to Text features.

## How?

I used [Movie Database](https://www.themoviedb.org/) API for this. The application gets two random sets of movies from the API and mix them up to generate a questionnaire.

The application requests two sets of movies from different random pages in the API. The first set contains the posters that are displayed to the user to take a guess, while the second set would provide the additional options in case the user wants to try that way (see commands below).

## Technologies used

The application is built using my [boilerplate](https://github.com/loqtor/react-boilerplate) (based on [Create React App](https://github.com/facebook/create-react-app)) with `redux` and `redux-saga` for state management and effects handling (or whatever you'd like to call it).

For Speech Recognition it uses:

- [Annyang](https://github.com/TalAter/annyang): Library that uses the Web Speech API to detect when a user said a specific command.
- [fuzzyset.js](https://glench.github.io/fuzzyset.js/): Library to match strings _fuzzily_.

### Current status

There are currently two versions of the game:

- [No keyphrasee one](https://guess-the-movie-dev.netlify.com): It just listens to everything you say and assumes you are trying to guess, unless you said a specific command.
- [Keyphrase one](https://guess-the-movie-keyphrase-dev.netlify.com): You need to say "yo" and wait for the game to say "take a guess" for your speech to be taken as a guess.

The first one can currently be found on [`develop`](https://github.com/loqtor/guess-the-movie) and the one with the keyphrase is currently under [`feature/keyphrase-fuzzymatching`](https://github.com/loqtor/guess-the-movie/tree/feature/keyphrase-fuzzy-matching).

#### Commands

- `next`: Take you to the next movie to be guessed (should work with `pass` and `I don't know` as well).
- `show options`: It shows you three possible alternatives that you can then say and try to guess from.
- [anything_else]: Assumes is the guess and tries to match it to the movie.

#### Hint

Fuzzyset is used to determine if the user is _close_ to the movie title. If so, then we show the movie title with some characters replaced as a hint for the user to take another guess.

## What's next?

### Relatively easy stuff

1. Add the possibility to show _bonus_ questions to the user (i.e.: After answering 3 in a row get an extra question).
2. Add capability to recognize cursing and just shows some sort of pun to the user (without interrupting the game).

### Distant future releases

4. Profile - Let the user create an account.
5. Challenge - Share your questionnaire with a friend so you can compete with him.

-----------------------------------------------

# Create React App stuff below.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br />
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (Webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: https://facebook.github.io/create-react-app/docs/code-splitting

### Analyzing the Bundle Size

This section has moved here: https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size

### Making a Progressive Web App

This section has moved here: https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app

### Advanced Configuration

This section has moved here: https://facebook.github.io/create-react-app/docs/advanced-configuration

### Deployment

This section has moved here: https://facebook.github.io/create-react-app/docs/deployment

### `npm run build` fails to minify

This section has moved here: https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify
