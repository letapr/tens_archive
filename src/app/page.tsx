import React from 'react';
import Header from '../components/Header';
import GameBoard from '../components/GameBoard';
import { initialGameData } from '../constants/gameData';

const HomePage = () => {
    return (
        <div>
            <GameBoard />
        </div>
    );
};

export default HomePage;