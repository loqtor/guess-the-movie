import React from 'react';
import './styles/app.scss';
import ReactDOM from 'react-dom';
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { composeWithDevTools } from 'redux-devtools-extension';
import { createStore, applyMiddleware } from 'redux'
import createSagaMiddleware from 'redux-saga'

import { Provider } from 'react-redux'
import { RootReducer } from "./store/reducers";

import * as serviceWorker from './serviceWorker';

import { Home } from '../src/pages/Home';
import { Game } from './pages/Game';
import rootSaga from './store/sagas';

const sagaMiddleware = createSagaMiddleware();
const store = createStore(
  RootReducer, 
  composeWithDevTools(applyMiddleware(sagaMiddleware)));

sagaMiddleware.run(rootSaga);

ReactDOM.render(
  <Provider store={store}>
    <Router>
      <Switch>
        <Route exact path="/" component={Home} />
        <Route path="/game" component={Game} />
      </Switch>
    </Router>
  </Provider>
  , document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
