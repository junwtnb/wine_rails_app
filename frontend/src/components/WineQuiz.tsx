import React, { useState, useEffect } from 'react';

interface QuizQuestion {
  id: number;
  question: string;
  options: Record<string, string>;
  difficulty: number;
  difficulty_label: string;
  category: string;
  correct_answer?: string;
  explanation?: string;
}

interface QuizResult {
  id: number;
  score: number;
  accuracy: number;
  correct_answers: number;
  total_questions: number;
  grade: string;
  grade_emoji: string;
  difficulty: number;
  difficulty_label: string;
  time_taken: number;
  time_bonus: number;
  difficulty_multiplier: number;
}

interface Achievement {
  title: string;
  description: string;
  emoji: string;
  type: string;
}

interface ReviewQuestion {
  question: QuizQuestion;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

interface WineQuizProps {
  onClose: () => void;
}

const WineQuiz: React.FC<WineQuizProps> = ({ onClose }) => {
  const [gameState, setGameState] = useState<'setup' | 'playing' | 'results' | 'review'>('setup');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(30);
  const [totalTime, setTotalTime] = useState(0);
  const [difficulty, setDifficulty] = useState(2);
  const [category, setCategory] = useState<string>('');
  const [questionCount, setQuestionCount] = useState(5);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewQuestions, setReviewQuestions] = useState<ReviewQuestion[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  const generateSessionId = () => {
    const stored = localStorage.getItem('wine-session-id');
    if (stored) return stored;

    const newSessionId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('wine-session-id', newSessionId);
    return newSessionId;
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === 'playing' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
        setTotalTime(prev => prev + 1);
      }, 1000);
    } else if (gameState === 'playing' && timeLeft === 0) {
      handleNextQuestion();
    }
    return () => clearInterval(interval);
  }, [gameState, timeLeft]);

  const startQuiz = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:3000/api/v1/wine_quiz/questions?difficulty=${difficulty}&count=${questionCount}${category ? `&category=${category}` : ''}`, {
        headers: {
          'X-Session-ID': generateSessionId(),
        },
      });

      if (!response.ok) {
        throw new Error('問題の取得に失敗しました');
      }

      const data = await response.json();
      setQuestions(data.questions);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setTimeLeft(30);
      setTotalTime(0);
      setGameState('playing');
    } catch (err) {
      setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: number, answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeLeft(30);
    } else {
      submitQuiz();
    }
  };

  const submitQuiz = async () => {
    setLoading(true);

    try {
      const answers = questions.map(q => ({
        question_id: q.id,
        selected_answer: selectedAnswers[q.id] || ''
      }));

      const response = await fetch('http://localhost:3000/api/v1/wine_quiz/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': generateSessionId(),
        },
        body: JSON.stringify({
          answers: answers,
          difficulty: difficulty,
          time_taken: totalTime
        }),
      });

      if (!response.ok) {
        throw new Error('結果の送信に失敗しました');
      }

      const data = await response.json();
      setResult(data.quiz_result);
      setAchievements(data.achievements || []);

      // Process review questions for incorrect answers
      const reviewData: ReviewQuestion[] = [];
      if (data.results) {
        data.results.forEach((questionResult: any) => {
          if (!questionResult.is_correct) {
            const question = questions.find(q => q.id === questionResult.question_id);
            if (question) {
              reviewData.push({
                question: {
                  ...question,
                  correct_answer: questionResult.correct_answer,
                  explanation: questionResult.explanation
                },
                selectedAnswer: questionResult.selected_answer,
                correctAnswer: questionResult.correct_answer,
                isCorrect: questionResult.is_correct
              });
            }
          }
        });
      }
      setReviewQuestions(reviewData);
      setCurrentReviewIndex(0);

      setGameState('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : '送信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const resetQuiz = () => {
    setGameState('setup');
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setResult(null);
    setAchievements([]);
    setReviewQuestions([]);
    setCurrentReviewIndex(0);
    setError(null);
  };

  const startReview = () => {
    setGameState('review');
    setCurrentReviewIndex(0);
  };

  const handleNextReview = () => {
    if (currentReviewIndex < reviewQuestions.length - 1) {
      setCurrentReviewIndex(prev => prev + 1);
    } else {
      setGameState('results');
    }
  };

  const handlePrevReview = () => {
    if (currentReviewIndex > 0) {
      setCurrentReviewIndex(prev => prev - 1);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  if (loading) return <div className="quiz-loading">読み込み中...</div>;

  return (
    <div className="wine-quiz-overlay">
      <div className="wine-quiz">
        <div className="quiz-header">
          <h2>🏆 ワイン知識クイズ</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && <div className="error">{error}</div>}

        {gameState === 'setup' && (
          <div className="quiz-setup">
            <h3>クイズ設定</h3>
            <div className="setup-grid">
              <div className="setup-item">
                <label>難易度</label>
                <select value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))}>
                  <option value={1}>初心者 (×1.0)</option>
                  <option value={2}>初級 (×1.2)</option>
                  <option value={3}>中級 (×1.5)</option>
                  <option value={4}>上級 (×2.0)</option>
                  <option value={5}>エキスパート (×3.0)</option>
                </select>
              </div>

              <div className="setup-item">
                <label>問題数</label>
                <select value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))}>
                  <option value={3}>3問 (お試し)</option>
                  <option value={5}>5問 (標準)</option>
                  <option value={8}>8問 (しっかり)</option>
                  <option value={10}>10問 (全力)</option>
                </select>
              </div>

              <div className="setup-item">
                <label>カテゴリ</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">すべて</option>
                  <option value="基礎知識">基礎知識</option>
                  <option value="地域">地域</option>
                  <option value="品種">品種</option>
                  <option value="製造">製造</option>
                  <option value="テイスティング">テイスティング</option>
                  <option value="歴史">歴史</option>
                </select>
              </div>
            </div>

            <button className="start-quiz-btn" onClick={startQuiz}>
              🚀 クイズスタート！
            </button>
          </div>
        )}

        {gameState === 'playing' && currentQuestion && (
          <div className="quiz-playing">
            <div className="quiz-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
              <span>{currentQuestionIndex + 1} / {questions.length}</span>
            </div>

            <div className="time-display">
              <div className={`timer ${timeLeft <= 5 ? 'urgent' : ''}`}>
                ⏰ {timeLeft}秒
              </div>
            </div>

            <div className="question-card">
              <div className="question-meta">
                <span className="difficulty">難易度: {currentQuestion.difficulty_label}</span>
                <span className="category">カテゴリ: {currentQuestion.category}</span>
              </div>

              <h3 className="question-text">{currentQuestion.question}</h3>

              <div className="answer-options">
                {Object.entries(currentQuestion.options).map(([key, value]) => (
                  <button
                    key={key}
                    className={`option-btn ${selectedAnswers[currentQuestion.id] === key ? 'selected' : ''}`}
                    onClick={() => handleAnswerSelect(currentQuestion.id, key)}
                  >
                    <span className="option-label">{key}</span>
                    <span className="option-text">{value}</span>
                  </button>
                ))}
              </div>

              <button
                className="next-btn"
                onClick={handleNextQuestion}
                disabled={!selectedAnswers[currentQuestion.id]}
              >
                {currentQuestionIndex === questions.length - 1 ? '結果を見る' : '次の問題'}
              </button>
            </div>
          </div>
        )}

        {gameState === 'results' && result && (
          <div className="quiz-results">
            <div className="result-header">
              <div className="grade-display">
                <span className="grade-emoji">{result.grade_emoji}</span>
                <span className="grade-text">グレード {result.grade}</span>
              </div>
              <div className="score-display">
                <span className="score-number">{result.score}</span>
                <span className="score-label">点</span>
              </div>
            </div>

            <div className="result-stats">
              <div className="stat-item">
                <span className="stat-label">正答率</span>
                <span className="stat-value">{result.accuracy}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">正解数</span>
                <span className="stat-value">{result.correct_answers}/{result.total_questions}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">難易度</span>
                <span className="stat-value">{result.difficulty_label}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">所要時間</span>
                <span className="stat-value">{Math.floor(result.time_taken / 60)}:{(result.time_taken % 60).toString().padStart(2, '0')}</span>
              </div>
            </div>

            {achievements.length > 0 && (
              <div className="achievements">
                <h4>🏅 アチーブメント獲得！</h4>
                {achievements.map((achievement, index) => (
                  <div key={index} className="achievement-item">
                    <span className="achievement-emoji">{achievement.emoji}</span>
                    <div className="achievement-text">
                      <strong>{achievement.title}</strong>
                      <p>{achievement.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="result-actions">
              {reviewQuestions.length > 0 && (
                <button className="review-btn" onClick={startReview}>
                  📝 間違えた問題を振り返る ({reviewQuestions.length}問)
                </button>
              )}
              <button className="retry-btn" onClick={resetQuiz}>
                🔄 もう一度挑戦
              </button>
              <button className="close-btn-result" onClick={onClose}>
                閉じる
              </button>
            </div>
          </div>
        )}

        {gameState === 'review' && reviewQuestions.length > 0 && (
          <div className="quiz-review">
            <div className="review-header">
              <h3>📝 問題振り返り</h3>
              <div className="review-progress">
                <span>{currentReviewIndex + 1} / {reviewQuestions.length}</span>
              </div>
            </div>

            <div className="review-question-card">
              <div className="question-meta">
                <span className="difficulty">難易度: {reviewQuestions[currentReviewIndex].question.difficulty_label}</span>
                <span className="category">カテゴリ: {reviewQuestions[currentReviewIndex].question.category}</span>
                <span className="result-badge incorrect">❌ 不正解</span>
              </div>

              <h3 className="question-text">{reviewQuestions[currentReviewIndex].question.question}</h3>

              <div className="review-answers">
                {Object.entries(reviewQuestions[currentReviewIndex].question.options).map(([key, value]) => {
                  const isSelected = reviewQuestions[currentReviewIndex].selectedAnswer === key;
                  const isCorrect = reviewQuestions[currentReviewIndex].correctAnswer === key;

                  let className = 'review-option';
                  if (isSelected && !isCorrect) className += ' selected-wrong';
                  if (isCorrect) className += ' correct-answer';

                  return (
                    <div key={key} className={className}>
                      <span className="option-label">{key}</span>
                      <span className="option-text">{value}</span>
                      {isSelected && !isCorrect && <span className="indicator">あなたの回答</span>}
                      {isCorrect && <span className="indicator">正解</span>}
                    </div>
                  );
                })}
              </div>

              {reviewQuestions[currentReviewIndex].question.explanation && (
                <div className="explanation">
                  <h4>💡 解説</h4>
                  <p>{reviewQuestions[currentReviewIndex].question.explanation}</p>
                </div>
              )}

              <div className="review-navigation">
                <button
                  className="prev-btn"
                  onClick={handlePrevReview}
                  disabled={currentReviewIndex === 0}
                >
                  ← 前の問題
                </button>
                <button className="back-to-results-btn" onClick={() => setGameState('results')}>
                  結果に戻る
                </button>
                <button
                  className="next-btn"
                  onClick={handleNextReview}
                >
                  {currentReviewIndex === reviewQuestions.length - 1 ? '結果に戻る' : '次の問題 →'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WineQuiz;