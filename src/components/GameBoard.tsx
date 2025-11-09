"use client"

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initialGameData, allStates, allCountries } from '../constants/gameData';
import { GAME_CONFIG } from '../utils/dynamodb';
import { fetchDailyGame, findMostRecentGame } from '../utils/dynamodb';
import { useGame } from '../context/GameContext';

const GameBoard: React.FC = () => {
    const [gameData, setGameData] = useState(initialGameData);
    const [selectedDate, setSelectedDate] = useState('');
    const [hasUserInteracted, setHasUserInteracted] = useState(false);
    const suggestionList = useMemo(() => {
        const title = gameData.title.toLowerCase();
        if (title.includes('states')) {
            return allStates;
        } else if (title.includes('countries')) {
            return allCountries;
        }
        return [];
    }, [gameData.title]);
    const [answers, setAnswers] = useState<(string | null)[]>(Array(10).fill(null));
    const [currentAnswer, setCurrentAnswer] = useState('');
    const { lives, setLives } = useGame();
    const [gameOver, setGameOver] = useState(false);
    const [correctCount, setCorrectCount] = useState(0);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadGameData = async (date: string, isUserInteraction = false) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/game?date=${date}`);
            if (!response.ok) {
                throw new Error('Game data not available');
            }
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            setGameData(data);
            setSelectedDate(date); // Set the date when we successfully load the game
            setError(null);
            setAnswers(Array(10).fill(null));
            setLives(GAME_CONFIG.maxLives);
            setGameOver(false);
            setCorrectCount(0);
            setGuessedAnswers(new Set());
        } catch (error) {
            console.error('Failed to load game data:', error);
            if (isUserInteraction) {
                setError(`No game available for ${date}`);
                setGameOver(true);
                setSelectedDate(date); // Keep the selected date even if it fails
            } else {
                // If this is the initial load, try to load the most recent game
                const previousDate = await findMostRecentGame(date);
                if (previousDate) {
                    await loadGameData(previousDate);
                    return;
                }
                setError('No games available');
                setGameOver(true);
            }
        } finally {
            setLoading(false);
        }
    };

    const loadPreviousGame = async () => {
        setLoading(true);
        try {
            const previousDate = await findMostRecentGame(selectedDate);
            if (!previousDate) {
                setError('No previous games found');
                return;
            }
            await loadGameData(previousDate, true);
        } catch (error) {
            console.error('Failed to load previous game:', error);
            setError('Failed to load previous game');
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        setHasUserInteracted(true);
        loadGameData(newDate, true);
    };

    useEffect(() => {
        const loadInitialGame = async () => {
            const today = new Date().toISOString().split('T')[0];
            await loadGameData(today, false);
        };

        loadInitialGame();
    }, []); // Empty dependency array means this only runs once on mount
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
            (correct: string) => correct.toLowerCase() === normalizedAnswer
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
                setLives(lives - 1);
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
        return Array(10).fill(null).map((_, index) => {
            const showAnswer = answers[index] || (gameOver && lives <= 0);
            const answerText = showAnswer ? (answers[index] || gameData.correctAnswers[index]) : '???';
            const isRevealed = showAnswer && !answers[index];
            
            return (
                <div key={index} className="answer-slot-container">
                    <div className={`answer-slot ${showAnswer ? 'flipped' : ''} ${isRevealed ? 'revealed' : ''}`}>
                        <div className="answer-slot-front">
                            <span className="answer-number">{index + 1}.</span>
                            <div className="answer-text">???</div>
                        </div>
                        <div className="answer-slot-back">
                            <span className="answer-number">{index + 1}.</span>
                            <div className="answer-text">{answerText}</div>
                        </div>
                    </div>
                </div>
            );
        });
    };

    if (loading) {
        return (
            <div className="game-board">
                <div className="loading">Loading today's game...</div>
            </div>
        );
    }

    const DatePicker = () => (
        <div className="date-picker">
            <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                max={new Date().toISOString().split('T')[0]}
            />
        </div>
    );

    if (error && (hasUserInteracted || error === 'No games available')) {
        return (
            <div className="game-board">
                <DatePicker />
                <div className="error-message">
                    <h2>{error}</h2>
                    <button 
                        className="load-previous-button"
                        onClick={loadPreviousGame}
                    >
                        Load Previous Game
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="game-board">
            <DatePicker />
            <h1 className="game-title">{gameData.title}</h1>
            <div className="lives">
                {Array(GAME_CONFIG.maxLives).fill(null).map((_, i) => (
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
                    {lives <= 0 ? (
                        <>
                            <h2>Game Over! You ran out of lives.</h2>
                            <p>The remaining answers have been revealed in red.</p>
                        </>
                    ) : (
                        <h2>Congratulations! You found all the answers!</h2>
                    )}
                </div>
            )}
        </div>
    );
};

export default GameBoard;