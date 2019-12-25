import React from 'react';
import { Link } from 'react-router-dom';

export const Home = () => (
  <>
    <h1>Welcome to the boilerplate!</h1>
    <Link to="game">Go to the game!</Link>
  </>
);