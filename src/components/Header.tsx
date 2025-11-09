'use client';

import React from 'react';
import { useGame } from '../context/GameContext';

const Header: React.FC = () => {
    const { addLife, canAddLife } = useGame();

    return (
        <header>
            <h1 
                className="title"
                onClick={canAddLife ? addLife : undefined}
            >
                Daily Tens
            </h1>
            <nav>
                {/* Add navigation elements here if needed */}
            </nav>
        </header>
    );
};

export default Header;