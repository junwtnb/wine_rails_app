class WineQuizResult < ApplicationRecord
  validates :session_id, presence: true
  validates :score, :total_questions, :correct_answers, presence: true
  validates :difficulty, presence: true, inclusion: { in: 1..5 }

  scope :by_session, ->(session_id) { where(session_id: session_id) }
  scope :recent, -> { where('completed_at > ?', 30.days.ago) }
  scope :by_difficulty, ->(level) { where(difficulty: level) }

  def accuracy_percentage
    return 0 if total_questions.zero?
    ((correct_answers.to_f / total_questions) * 100).round(1)
  end

  def grade
    case accuracy_percentage
    when 90..100 then 'S'
    when 80..89 then 'A'
    when 70..79 then 'B'
    when 60..69 then 'C'
    when 50..59 then 'D'
    else 'F'
    end
  end

  def grade_emoji
    case grade
    when 'S' then '🏆'
    when 'A' then '🥇'
    when 'B' then '🥈'
    when 'C' then '🥉'
    when 'D' then '📝'
    else '😅'
    end
  end

  def difficulty_label
    WineQuizQuestion::DIFFICULTIES[difficulty]
  end

  def self.user_statistics(session_id)
    results = by_session(session_id).recent

    return default_statistics if results.empty?

    # 基本統計
    total_questions = results.sum(:total_questions)
    total_correct = results.sum(:correct_answers)
    accuracy = total_questions > 0 ? ((total_correct.to_f / total_questions) * 100).round(1) : 0

    # 難易度別統計
    difficulty_stats = {}
    (1..5).each do |level|
      level_results = results.where(difficulty: level)
      next if level_results.empty?

      level_total_questions = level_results.sum(:total_questions)
      level_total_correct = level_results.sum(:correct_answers)
      level_accuracy = level_total_questions > 0 ?
        ((level_total_correct.to_f / level_total_questions) * 100).round(1) : 0

      difficulty_stats[level.to_s] = {
        count: level_results.count,
        correct: level_total_correct,
        accuracy: level_accuracy,
        avg_score: (level_results.average(:score)&.to_f || 0).round(1)
      }
    end

    # カテゴリ別統計（クイズ結果から関連する問題のカテゴリを取得）
    category_stats = {}

    # 最近の結果（詳細情報付き）
    recent_results = results.order(completed_at: :desc).limit(5).map do |result|
      {
        id: result.id,
        score: result.score,
        accuracy: result.accuracy_percentage,
        difficulty_label: result.difficulty_label,
        total_questions: result.total_questions,
        correct_answers: result.correct_answers,
        completed_at: result.completed_at.iso8601,
        grade: result.grade,
        grade_emoji: result.grade_emoji
      }
    end

    {
      total_quizzes: results.count,
      total_questions: total_questions,
      total_correct: total_correct,
      accuracy_percentage: accuracy,
      average_score: (results.average(:score)&.to_f || 0).round(1),
      best_score: results.maximum(:score) || 0,
      difficulty_breakdown: difficulty_stats,
      category_breakdown: category_stats,
      recent_results: recent_results,
      grade_distribution: results.group('CASE
        WHEN (correct_answers::float / total_questions * 100) >= 90 THEN \'S\'
        WHEN (correct_answers::float / total_questions * 100) >= 80 THEN \'A\'
        WHEN (correct_answers::float / total_questions * 100) >= 70 THEN \'B\'
        WHEN (correct_answers::float / total_questions * 100) >= 60 THEN \'C\'
        WHEN (correct_answers::float / total_questions * 100) >= 50 THEN \'D\'
        ELSE \'F\'
      END').count
    }
  end

  private

  def self.default_statistics
    {
      total_quizzes: 0,
      total_questions: 0,
      total_correct: 0,
      accuracy_percentage: 0,
      average_score: 0,
      best_score: 0,
      difficulty_breakdown: {},
      category_breakdown: {},
      recent_results: [],
      grade_distribution: {}
    }
  end
end
