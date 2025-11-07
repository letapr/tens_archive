"use client"

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { gameData, allStates, allCountries } from '../constants/gameData';

const GameBoard: React.FC = () => {
    const suggestionList = useMemo(() => {
        const title = gameData.title.toLowerCase();
        if (title.includes('states')) {
            return allStates;
        } else if (title.includes('countries')) {
            return allCountries;
        }
        return [];
    }, []);
    const [answers, setAnswers] = useState<(string | null)[]>(Array(10).fill(null));
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [lives, setLives] = useState(gameData.maxLives);
    const [gameOver, setGameOver] = useState(false);
    const [correctCount, setCorrectCount] = useState(0);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [guessedAnswers, setGuessedAnswers] = useState<Set<string>>(new Set());
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    const checkAnswer = (answer: string) => {
        const normalizedAnswer = answer.trim().toLowerCase();
        
        // Check if this answer has been guessed before
        if (guessedAnswers.has(normalizedAnswer)) {
            return 'duplicate';
        }

        const index = gameData.correctAnswers.findIndex(
            correct => correct.toLowerCase() === normalizedAnswer
        );
        
        // Add to guessed answers regardless of correctness
        setGuessedAnswers(prev => new Set(prev).add(normalizedAnswer));
        
        if (index !== -1 && !answers[index]) {
            const newAnswers = [...answers];
            newAnswers[index] = gameData.correctAnswers[index];
            setAnswers(newAnswers);
            setCorrectCount(prev => prev + 1);
            return 'correct';
        }
        return 'incorrect';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentAnswer.trim() && !gameOver) {
            const result = checkAnswer(currentAnswer);
            if (result === 'incorrect') {
                setLives(prev => prev - 1);
            }
            setCurrentAnswer('');
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    useEffect(() => {
        if (lives === 0 || correctCount === 10) {
            setGameOver(true);
        }
    }, [lives, correctCount]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCurrentAnswer(value);
        
        if (value.trim()) {
            const filtered = suggestionList.filter(item => 
                item.toLowerCase().includes(value.toLowerCase())
            );
            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setCurrentAnswer(suggestion);
        setSuggestions([]);
        setShowSuggestions(false);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const renderAnswerSlots = () => {
        return Array(10).fill(null).map((_, index) => (
            <div key={index} className="answer-slot-container">
                <div className={`answer-slot ${answers[index] ? 'flipped' : ''}`}>
                    <div className="answer-slot-front">
                        <span className="answer-number">{index + 1}.</span>
                        <div className="answer-text">???</div>
                    </div>
                    <div className="answer-slot-back">
                        <span className="answer-number">{index + 1}.</span>
                        <div className="answer-text">{answers[index]}</div>
                    </div>
                </div>
            </div>
        ));
    };

    return (
        <div className="game-board">
            <h1 className="game-title">{gameData.title}</h1>
            <div className="lives">
                {Array(gameData.maxLives).fill(null).map((_, i) => (
                    <span key={i} className="heart">
                        {i < lives ? '❤️' : '💔'}
                    </span>
                ))}
            </div>
            <form onSubmit={handleSubmit} className="answer-form">
                <div className="input-container">
                    <div className="input-wrapper">
                        <span className="input-icon">+</span>
                        <input
                            ref={inputRef}
                            type="text"
                            value={currentAnswer}
                            onChange={handleInputChange}
                            placeholder="ENTER TEXT HERE"
                            className="answer-input"
                            disabled={gameOver}
                        />
                        <button type="submit" className="submit-button" disabled={gameOver}>➜</button>
                    </div>
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="suggestions" ref={suggestionsRef}>
                            {suggestions.map((suggestion, index) => (
                                <div
                                    key={index}
                                    className={`suggestion-item ${guessedAnswers.has(suggestion.toLowerCase()) ? 'guessed' : ''}`}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                >
                                    {suggestion}
                                    {guessedAnswers.has(suggestion.toLowerCase()) && 
                                        <span className="guessed-indicator">✓</span>
                                    }
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </form>
            <div className="answer-grid">
                {renderAnswerSlots()}
            </div>
            {gameOver && (
                <div className="game-over">
                    {lives === 0 ? (
                        <h2>Game Over! You ran out of lives.</h2>
                    ) : (
                        <h2>Congratulations! You found all the states!</h2>
                    )}
                </div>
            )}
        </div>
    );
};

export default GameBoard;