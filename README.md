# Guess the Movie

Questionnaire game that can be played through speech. :)

Currently a work in progress but getting there.

## Why?

An experiment to test the SpeechRecognition API by using a [React Component](https://github.com/loqtor/react-speech-recognizer) I put together for that.

## How?

I used [Movie Database](https://www.themoviedb.org/) API for this. The application gets two random sets of movies from the API and mix them up to generate a questionnaire.

The first set of movies will be the ones whose poster would be used and the right answers to the questionnaire, while the second one is where the incorrect options come from.

## Technologies used

The application is built using my [boilerplate](https://github.com/loqtor/react-boilerplate) (based on [Create React App](https://github.com/facebook/create-react-app)) with `redux` and `redux-saga` for state management and effects handling (or whatever you'd like to call it).

## Current status

[`react-speech-recognizer`](https://github.com/loqtor/react-speech-recognizer) works fine and does what it's supposed to. However, there are bits an pieces referred to handling the results you get out of the `SpeechRecognizer` that need to be worked on:

1 - **It's not fully exact**. The many possibilities you get back implies a big cleaning exercise.
2 - **It struggles with accents**. So, targeting a strict match might not be the way to go to keep the game engaging.

With this in mind there's currently 3 branches with different instances on each:

1 - `develop`: Instead of using Speech Recognition is just showing movie options.
2 - `feature/annyang`: Library that takes commands as strings and runs callbacks when they are called. Seems more stable and polished than what I did. But still, the technology itself is a bit fuzzy yet, hence it's not a 100% accurate (getting `noMatch` event triggered most of the time).
3 - `feature/annyang-fuzzyset`: Since the technology is not really that exact, the `noMatch` handler will be performing a second _fuzzy_ comparison to see if the user was correct or not.

## What's next?

### Relatively easy stuff

1. Add the possibility to show _bonus_ questions to the user (i.e.: After answering 3 in a row get an extra question).
2. Add an `options` command for the user to see three possible movies the poster would belong to.
3. Add capability ot recognize cursing and just shows some sort of pun to the user (without interrupting the game).

### Distant future releases

4. Profile - Let the user create an account.
5. Challenge - Share your questionnaire with a friend so you can compete with him.

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
