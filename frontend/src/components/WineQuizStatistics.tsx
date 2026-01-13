import React, { useState, useEffect } from 'react';

interface QuizStatistics {
  total_quizzes: number;
  total_questions: number;
  total_correct: number;
  accuracy_percentage: number;
  average_score: number;
  best_score: number;
  difficulty_breakdown: Record<string, {
    count: number;
    correct: number;
    accuracy: number;
    avg_score: number;
  }>;
  category_breakdown: Record<string, {
    count: number;
    correct: number;
    accuracy: number;
  }>;
  recent_results: Array<{
    id: number;
    score: number;
    accuracy: number;
    difficulty_label: string;
    total_questions: number;
    correct_answers: number;
    completed_at: string;
    grade: string;
    grade_emoji: string;
  }>;
}

interface WineQuizStatisticsProps {
  onClose: () => void;
}

const WineQuizStatistics: React.FC<WineQuizStatisticsProps> = ({ onClose }) => {
  const [statistics, setStatistics] = useState<QuizStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generateSessionId = () => {
    const stored = localStorage.getItem('wine-session-id');
    if (stored) return stored;

    const newSessionId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('wine-session-id', newSessionId);
    return newSessionId;
  };

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const sessionId = generateSessionId();
        const response = await fetch('http://localhost:3000/api/v1/wine_quiz/statistics', {
          headers: {
            'X-Session-ID': sessionId,
          },
        });

        if (!response.ok) {
          throw new Error('統計データの取得に失敗しました');
        }

        const data = await response.json();
        setStatistics(data.statistics);
      } catch (err) {
        setError(err instanceof Error ? err.message : '不明なエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderDifficultyStats = () => {
    if (!statistics?.difficulty_breakdown) return null;

    const difficulties = Object.entries(statistics.difficulty_breakdown)
      .sort(([a], [b]) => parseInt(a) - parseInt(b));

    return (
      <div className="stat-section">
        <h3>📊 難易度別成績</h3>
        <div className="difficulty-stats">
          {difficulties.map(([level, stats]) => (
            <div key={level} className="difficulty-stat">
              <div className="difficulty-header">
                <span className="difficulty-name">{getDifficultyLabel(parseInt(level))}</span>
                <span className="quiz-count">{stats.count}回</span>
              </div>
              <div className="accuracy-bar">
                <div
                  className="accuracy-fill"
                  style={{ width: `${stats.accuracy}%` }}
                ></div>
              </div>
              <div className="difficulty-details">
                <span>正答率: {stats.accuracy.toFixed(1)}%</span>
                <span>平均スコア: {stats.avg_score.toFixed(0)}点</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCategoryStats = () => {
    if (!statistics?.category_breakdown) return null;

    const categories = Object.entries(statistics.category_breakdown)
      .sort(([, a], [, b]) => b.accuracy - a.accuracy)
      .slice(0, 6);

    return (
      <div className="stat-section">
        <h3>📚 カテゴリ別成績</h3>
        <div className="category-stats">
          {categories.map(([category, stats]) => (
            <div key={category} className="category-stat">
              <span className="category-name">{category}</span>
              <span className="category-accuracy">{stats.accuracy.toFixed(1)}%</span>
              <span className="category-count">({stats.count}問)</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getDifficultyLabel = (level: number): string => {
    const labels: Record<number, string> = {
      1: '初心者',
      2: '初級',
      3: '中級',
      4: '上級',
      5: 'エキスパート'
    };
    return labels[level] || '不明';
  };

  if (loading) return <div className="quiz-loading">統計データを読み込み中...</div>;
  if (error) return <div className="error">エラー: {error}</div>;
  if (!statistics) return <div className="error">データが見つかりませんでした</div>;

  return (
    <div className="wine-quiz-statistics-overlay">
      <div className="wine-quiz-statistics">
        <div className="statistics-header">
          <h2>🏆 クイズ成績統計</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="statistics-content">
          {/* 総合成績 */}
          <div className="summary-section">
            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-number">{statistics.total_quizzes}</div>
                <div className="summary-label">総クイズ数</div>
              </div>
              <div className="summary-card">
                <div className="summary-number">{statistics.total_questions}</div>
                <div className="summary-label">総問題数</div>
              </div>
              <div className="summary-card">
                <div className="summary-number">{statistics.accuracy_percentage.toFixed(1)}%</div>
                <div className="summary-label">全体正答率</div>
              </div>
              <div className="summary-card">
                <div className="summary-number">{statistics.best_score}</div>
                <div className="summary-label">最高スコア</div>
              </div>
            </div>
          </div>

          {/* 難易度別統計 */}
          {renderDifficultyStats()}

          {/* カテゴリ別統計 */}
          {renderCategoryStats()}

          {/* 最近の結果 */}
          {statistics.recent_results && statistics.recent_results.length > 0 && (
            <div className="stat-section">
              <h3>🕒 最近の結果</h3>
              <div className="recent-results">
                {statistics.recent_results.slice(0, 5).map((result) => (
                  <div key={result.id} className="recent-result">
                    <div className="result-main">
                      <span className="result-grade">{result.grade_emoji} {result.grade}</span>
                      <span className="result-score">{result.score}点</span>
                    </div>
                    <div className="result-details">
                      <span>{result.difficulty_label}</span>
                      <span>{result.correct_answers}/{result.total_questions}問正解</span>
                      <span>{formatDate(result.completed_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="stats-note">
            <p>📈 継続してクイズに挑戦することで、ワインの知識がどんどん深まっていきます！</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WineQuizStatistics;