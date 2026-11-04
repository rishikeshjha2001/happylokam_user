import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
} from 'react-native';
import { Sparkles, RotateCcw, X, Trophy, Users, Bot, Gamepad2 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const BOARD_SIZE = Math.min(width - 56, 330);
const CELL_SIZE = (BOARD_SIZE - 24) / 3;

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

  const celebrationScale = React.useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    loadScore();
  }, []);

  useEffect(() => {
    if (winner) {
      Animated.spring(celebrationScale, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }).start();
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

  // Bot move with heuristic intelligence
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

      // 4. Random available corner or edge
      const available = currentBoard
        .map((cell, idx) => (cell === null ? idx : null))
        .filter((idx): idx is number => idx !== null);

      if (available.length > 0) {
        const randomIdx = available[Math.floor(Math.random() * available.length)];
        applyMove(randomIdx, '🎉', currentBoard);
      }
    }, 380);
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
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Gamepad2 size={20} color="#e11d48" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Celebration Tic-Tac-Toe</Text>
                <Text style={styles.headerSub}>Offline Play • Zero Internet Needed</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#64748b" />
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
              <Bot size={15} color={gameMode === 'bot' ? '#ffffff' : '#64748b'} />
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
              <Users size={15} color={gameMode === 'pvp' ? '#ffffff' : '#64748b'} />
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

          {/* Winner Celebration Banner */}
          {winner && (
            <Animated.View
              style={[
                styles.winnerBanner,
                {
                  transform: [{ scale: celebrationScale }],
                },
              ]}
            >
              <Trophy size={22} color="#b45309" />
              <View style={{ flex: 1 }}>
                <Text style={styles.winnerTextTitle}>
                  {winner === 'DRAW' ? 'Celebration Tie! 🤝' : 'HappyLokam Winner! 🏆🎉'}
                </Text>
                <Text style={styles.winnerTextSub}>
                  {winner === 'DRAW'
                    ? 'A perfectly balanced celebration match!'
                    : winner === '👑'
                      ? '👑 Player 1 Takes The Crown!'
                      : gameMode === 'bot'
                        ? '🎉 Celebration Bot Takes The Trophy!'
                        : '🎉 Player 2 Takes The Crown!'}
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Turn Indicator (When game is ongoing) */}
          {!winner && (
            <View style={styles.turnCard}>
              <Sparkles size={14} color="#e11d48" />
              <Text style={styles.turnText}>
                {`Current Turn: ${isXNext ? '👑 Player 1' : gameMode === 'bot' ? '🎉 Bot Thinking...' : '🎉 Player 2'}`}
              </Text>
            </View>
          )}

          {/* 3x3 Game Board - Responsive Structured Grid */}
          <View style={styles.boardGrid}>
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
                      <Text style={styles.cellText}>{cell}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.resetBtn} onPress={resetGame} activeOpacity={0.8}>
              <RotateCcw size={16} color="#0f172a" />
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
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 390,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ffe4e6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 4,
    width: '100%',
    marginBottom: 14,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  modeTabActive: {
    backgroundColor: '#e11d48',
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  modeTabTextActive: {
    color: '#ffffff',
  },
  scoreBoard: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  scoreDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#cbd5e1',
  },
  winnerBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fef3c7',
    borderWidth: 1.5,
    borderColor: '#eab308',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginBottom: 14,
  },
  winnerTextTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#b45309',
  },
  winnerTextSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#78350f',
    marginTop: 1,
  },
  turnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff1f2',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    marginBottom: 14,
  },
  turnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e11d48',
  },
  boardGrid: {
    width: '100%',
    maxWidth: 320,
    aspectRatio: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 18,
    padding: 8,
    gap: 8,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  boardRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  cell: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
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
    borderWidth: 2.5,
    borderColor: '#eab308',
  },
  cellText: {
    fontSize: 34,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  resetBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  clearBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
});

