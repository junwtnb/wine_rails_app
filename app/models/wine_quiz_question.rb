class WineQuizQuestion < ApplicationRecord
  validates :question, presence: true
  validates :correct_answer, presence: true
  validates :option_a, :option_b, :option_c, :option_d, presence: true
  validates :difficulty, presence: true, inclusion: { in: 1..5 }
  validates :category, presence: true

  scope :by_difficulty, ->(level) { where(difficulty: level) }
  scope :by_category, ->(cat) { where(category: cat) }
  scope :random_questions, ->(count = 10) { order('RANDOM()').limit(count) }

  CATEGORIES = %w[基礎知識 地域 品種 製造 テイスティング 歴史].freeze
  DIFFICULTIES = {
    1 => '初心者',
    2 => '初級',
    3 => '中級',
    4 => '上級',
    5 => 'エキスパート'
  }.freeze

  def options
    [option_a, option_b, option_c, option_d]
  end

  def options_with_labels
    {
      'A' => option_a,
      'B' => option_b,
      'C' => option_c,
      'D' => option_d
    }
  end

  def difficulty_label
    DIFFICULTIES[difficulty]
  end
end
