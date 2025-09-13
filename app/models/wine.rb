class Wine < ApplicationRecord
  scope :search_by_name, ->(query) { where("name ILIKE ?", "%#{query}%") }
end
