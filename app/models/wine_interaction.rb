class WineInteraction < ApplicationRecord
  validates :session_id, presence: true
  validates :wine_name, presence: true
  validates :searched_at, presence: true

  scope :recent, -> { where('searched_at > ?', 30.days.ago) }
  scope :by_session, ->(session_id) { where(session_id: session_id) }
  scope :by_region, ->(country) { where(region_country: country) }
  scope :by_wine_type, ->(type) { where(wine_type: type) }

  def self.statistics_for_session(session_id)
    interactions = by_session(session_id).recent

    {
      total_searches: interactions.count,
      favorite_regions: interactions.where.not(region_country: nil).group(:region_country).count.sort_by(&:last).reverse.first(5).to_h,
      favorite_wine_types: interactions.group(:wine_type).count.sort_by(&:last).reverse.first(5).to_h,
      favorite_descriptions: interactions.group(:description_word).count.sort_by(&:last).reverse.first(10).to_h,
      vintage_preferences: interactions.where.not(vintage_year: nil).group(:vintage_year).count.sort_by(&:first).reverse.first(10).to_h,
      search_frequency: interactions.group_by_day(:searched_at, last: 30, format: "%m/%d").count
    }
  end
end
