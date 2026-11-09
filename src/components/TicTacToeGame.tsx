import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  useWindowDimensions,
  Animated,
  Easing,
} from 'react-native';
import { Sparkles, RotateCcw, X, Trophy, Users, Bot, Gamepad2, Award } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TicTacToeModalProps {
  visible: boolean;
  onClose: () => void;
}

type Player = '👑' | '🎉' | null;

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6],           // Diagonals
];

export default function TicTacToeGame({ visible, onClose }: TicTacToeModalProps) {
  const { width: winWidth, height: winHeight } = useWindowDimensions();

  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true);
  const [gameMode, setGameMode] = useState<'bot' | 'pvp'>('bot');
  const [winner, setWinner] = useState<Player | 'DRAW' | null>(null);
  const [winningLine, setWinningLine] = useState<number[]>([]);
  const [score, setScore] = useState<{ wins: number; losses: number; draws: number }>({
    wins: 0,
    losses: 0,
    draws: 0,
  });

  // Animations
  const celebrationScale = useRef(new Animated.Value(0.7)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;
  const particleAnim = useRef(new Animated.Value(0)).current;

  // Responsive board sizing: guaranteed never to clip or push buttons out
  const boardSize = Math.max(200, Math.min(winWidth - 80, winHeight * 0.33, 275));

  useEffect(() => {
    loadScore();
  }, []);

  useEffect(() => {
    if (winner) {
      celebrationScale.setValue(0.7);
      celebrationOpacity.setValue(0);
      particleAnim.setValue(0);

      Animated.parallel([
        Animated.spring(celebrationScale, {
          toValue: 1,
          friction: 4,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(celebrationOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(particleAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [winner]);

  const loadScore = async () => {
    try {
      const raw = await AsyncStorage.getItem('@happylokam_tictactoe_score');
      if (raw) setScore(JSON.parse(raw));
    } catch {}
  };

  const saveScore = async (newScore: { wins: number; losses: number; draws: number }) => {
    setScore(newScore);
    try {
      await AsyncStorage.setItem('@happylokam_tictactoe_score', JSON.stringify(newScore));
    } catch {}
  };

  const checkWinner = (currentBoard: Player[]) => {
    for (const combo of WINNING_COMBOS) {
      const [a, b, c] = combo;
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return { winner: currentBoard[a], line: combo };
      }
    }
    if (currentBoard.every((cell) => cell !== null)) {
      return { winner: 'DRAW' as const, line: [] };
    }
    return null;
  };

  const triggerBotMove = (currentBoard: Player[]) => {
    setTimeout(() => {
      // 1. Can bot win in 1 move?
      for (const combo of WINNING_COMBOS) {
        const [a, b, c] = combo;
        const line = [currentBoard[a], currentBoard[b], currentBoard[c]];
        if (line.filter((x) => x === '🎉').length === 2 && line.includes(null)) {
          const emptyIdx = [a, b, c].find((idx) => currentBoard[idx] === null)!;
          applyMove(emptyIdx, '🎉', currentBoard);
          return;
        }
      }

      // 2. Can player win in 1 move? Block them!
      for (const combo of WINNING_COMBOS) {
        const [a, b, c] = combo;
        const line = [currentBoard[a], currentBoard[b], currentBoard[c]];
        if (line.filter((x) => x === '👑').length === 2 && line.includes(null)) {
          const emptyIdx = [a, b, c].find((idx) => currentBoard[idx] === null)!;
          applyMove(emptyIdx, '🎉', currentBoard);
          return;
        }
      }

      // 3. Take center if available
      if (currentBoard[4] === null) {
        applyMove(4, '🎉', currentBoard);
        return;
      }

      // 4. Random available
      const available = currentBoard
        .map((cell, idx) => (cell === null ? idx : null))
        .filter((idx): idx is number => idx !== null);

      if (available.length > 0) {
        const randomIdx = available[Math.floor(Math.random() * available.length)];
        applyMove(randomIdx, '🎉', currentBoard);
      }
    }, 320);
  };

  const applyMove = (index: number, player: Player, currentBoard: Player[]) => {
    const nextBoard = [...currentBoard];
    nextBoard[index] = player;
    setBoard(nextBoard);

    const result = checkWinner(nextBoard);
    if (result) {
      setWinner(result.winner);
      setWinningLine(result.line);
      if (result.winner === '👑') {
        saveScore({ ...score, wins: score.wins + 1 });
      } else if (result.winner === '🎉') {
        saveScore({ ...score, losses: score.losses + 1 });
      } else {
        saveScore({ ...score, draws: score.draws + 1 });
      }
    } else {
      setIsXNext(player === '🎉');
    }
  };

  const handleCellPress = (index: number) => {
    if (board[index] || winner) return;

    const currentPlayer: Player = isXNext ? '👑' : '🎉';
    const nextBoard = [...board];
    nextBoard[index] = currentPlayer;
    setBoard(nextBoard);

    const result = checkWinner(nextBoard);
    if (result) {
      setWinner(result.winner);
      setWinningLine(result.line);
      if (result.winner === '👑') {
        saveScore({ ...score, wins: score.wins + 1 });
      } else if (result.winner === '🎉') {
        saveScore({ ...score, losses: score.losses + 1 });
      } else {
        saveScore({ ...score, draws: score.draws + 1 });
      }
      return;
    }

    if (gameMode === 'bot') {
      setIsXNext(false);
      triggerBotMove(nextBoard);
    } else {
      setIsXNext(!isXNext);
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningLine([]);
  };

  const clearAllScores = () => {
    saveScore({ wins: 0, losses: 0, draws: 0 });
    resetGame();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { maxHeight: Math.min(winHeight * 0.94, 620) }]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Gamepad2 size={18} color="#e11d48" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Celebration Tic-Tac-Toe</Text>
                <Text style={styles.headerSub}>Offline Play • Zero Internet Needed</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Mode Switcher */}
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeTab, gameMode === 'bot' && styles.modeTabActive]}
              onPress={() => {
                setGameMode('bot');
                resetGame();
              }}
              activeOpacity={0.8}
            >
              <Bot size={14} color={gameMode === 'bot' ? '#ffffff' : '#64748b'} />
              <Text style={[styles.modeTabText, gameMode === 'bot' && styles.modeTabTextActive]}>
                vs Celebration Bot
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeTab, gameMode === 'pvp' && styles.modeTabActive]}
              onPress={() => {
                setGameMode('pvp');
                resetGame();
              }}
              activeOpacity={0.8}
            >
              <Users size={14} color={gameMode === 'pvp' ? '#ffffff' : '#64748b'} />
              <Text style={[styles.modeTabText, gameMode === 'pvp' && styles.modeTabTextActive]}>
                Pass & Play
              </Text>
            </TouchableOpacity>
          </View>

          {/* Scoreboard */}
          <View style={styles.scoreBoard}>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreVal}>{score.wins}</Text>
              <Text style={styles.scoreLabel}>👑 Player 1</Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreItem}>
              <Text style={styles.scoreVal}>{score.draws}</Text>
              <Text style={styles.scoreLabel}>Ties</Text>
            </View>
            <View style={styles.scoreDivider} />
            <View style={styles.scoreItem}>
              <Text style={styles.scoreVal}>{score.losses}</Text>
              <Text style={styles.scoreLabel}>{gameMode === 'bot' ? '🎉 Bot' : '🎉 Player 2'}</Text>
            </View>
          </View>

          {/* Winner Celebration Banner with Animated Confetti Effect */}
          {winner && (
            <Animated.View
              style={[
                styles.winnerBanner,
                {
                  opacity: celebrationOpacity,
                  transform: [{ scale: celebrationScale }],
                },
              ]}
            >
              <Trophy size={20} color="#b45309" />
              <View style={{ flex: 1 }}>
                <Text style={styles.winnerTextTitle}>
                  {winner === 'DRAW' ? 'Celebration Tie! 🤝' : 'HappyLokam Winner! 🏆🎉'}
                </Text>
                <Text style={styles.winnerTextSub}>
                  {winner === 'DRAW'
                    ? 'A perfectly balanced celebration match!'
                    : winner === '👑'
                      ? '👑 Player 1 is the HappyLokam Winner!'
                      : gameMode === 'bot'
                        ? '🎉 Celebration Bot is the HappyLokam Winner!'
                        : '🎉 Player 2 is the HappyLokam Winner!'}
                </Text>
              </View>
              {winner !== 'DRAW' && (
                <Animated.View
                  style={{
                    transform: [
                      {
                        translateY: particleAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [10, -5],
                        }),
                      },
                    ],
                  }}
                >
                  <Sparkles size={18} color="#eab308" />
                </Animated.View>
              )}
            </Animated.View>
          )}

          {/* Turn Indicator */}
          {!winner && (
            <View style={styles.turnCard}>
              <Sparkles size={12} color="#e11d48" />
              <Text style={styles.turnText}>
                {`Current Turn: ${isXNext ? '👑 Player 1' : gameMode === 'bot' ? '🎉 Bot Thinking...' : '🎉 Player 2'}`}
              </Text>
            </View>
          )}

          {/* 3x3 Game Board - Guaranteed Responsive Square Grid */}
          <View style={[styles.boardGrid, { width: boardSize, height: boardSize }]}>
            {[0, 1, 2].map((rowIndex) => (
              <View key={rowIndex} style={styles.boardRow}>
                {[0, 1, 2].map((colIndex) => {
                  const idx = rowIndex * 3 + colIndex;
                  const cell = board[idx];
                  const isWinningCell = winningLine.includes(idx);
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.cell,
                        isWinningCell && styles.winningCell,
                      ]}
                      onPress={() => handleCellPress(idx)}
                      disabled={Boolean(cell || winner || (!isXNext && gameMode === 'bot'))}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.cellText, { fontSize: Math.max(22, boardSize * 0.1) }]}>
                        {cell}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.resetBtn} onPress={resetGame} activeOpacity={0.8}>
              <RotateCcw size={15} color="#0f172a" />
              <Text style={styles.resetBtnText}>New Round</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.clearBtn} onPress={clearAllScores} activeOpacity={0.8}>
              <Text style={styles.clearBtnText}>Reset Scores</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  card: {
    width: '100%',
    maxWidth: 370,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#ffe4e6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 3,
    width: '100%',
    marginBottom: 10,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: 9,
  },
  modeTabActive: {
    backgroundColor: '#e11d48',
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  modeTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  modeTabTextActive: {
    color: '#ffffff',
  },
  scoreBoard: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  scoreLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 1,
  },
  scoreDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#cbd5e1',
  },
  winnerBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef3c7',
    borderWidth: 1.5,
    borderColor: '#eab308',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginBottom: 10,
  },
  winnerTextTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#b45309',
  },
  winnerTextSub: {
    fontSize: 10,
    fontWeight: '700',
    color: '#78350f',
    marginTop: 1,
  },
  turnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fff1f2',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  turnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#e11d48',
  },
  boardGrid: {
    backgroundColor: '#e2e8f0',
    borderRadius: 16,
    padding: 6,
    gap: 6,
    marginBottom: 12,
    justifyContent: 'space-between',
    alignSelf: 'center',
  },
  boardRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  cell: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  winningCell: {
    backgroundColor: '#fef08a',
    borderWidth: 2,
    borderColor: '#eab308',
  },
  cellText: {
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    justifyContent: 'center',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f1f5f9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  clearBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
});
