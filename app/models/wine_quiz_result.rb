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

    {
      total_quizzes: results.count,
      average_score: results.average(:score)&.round(1) || 0,
      average_accuracy: results.average('(correct_answers::float / total_questions * 100)')&.round(1) || 0,
      best_score: results.maximum(:score) || 0,
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
end
