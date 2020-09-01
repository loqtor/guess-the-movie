import React from 'react';
import { Link } from 'react-router-dom';

export const Home = () => (
  <div className="Container u-textCenter">
    <h1 className="h3 u-mT-lg">Welcome to Guess the Movie!</h1>
    <Link className="Button Button--primary" to="/game-refactor">Launch the game</Link>
  </div>
);