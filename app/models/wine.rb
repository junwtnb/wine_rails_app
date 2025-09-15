class Wine < ApplicationRecord
  scope :search_by_name, ->(query) { where("name ILIKE ?", "%#{query}%") }
  
  def recent_vintage?
    return false if vtg.nil?
    current_year = Date.current.year
    # 過去5年以内のワインを最新ヴィンテージとして扱う
    vtg >= (current_year - 5)
  end
  
  def vintage_category
    return nil if vtg.nil?
    current_year = Date.current.year
    
    case current_year - vtg
    when 0..2
      :very_recent  # とても新しい (0-2年前)
    when 3..5
      :recent       # 新しい (3-5年前)
    when 6..10
      :mature       # 熟成 (6-10年前)
    when 11..20
      :aged         # 熟成された (11-20年前)
    else
      :vintage      # ヴィンテージ (21年以上前)
    end
  end
end
