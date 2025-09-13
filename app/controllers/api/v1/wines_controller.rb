class Api::V1::WinesController < ApplicationController
  def index
    wines = Wine.all
    render json: wines
  end

  def show
    wine = Wine.find(params[:id])
    render json: wine
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'ワインが見つかりません' }, status: :not_found
  end

  def search_by_name
    query = params[:query]
    return render json: { error: '検索クエリが必要です' }, status: :bad_request if query.blank?

    wines = Wine.search_by_name(query)
    
    if wines.empty?
      # 検索でヒットしなかった場合、新しい感想を生成
      description_word = generate_description_from_name(query)
      render json: { 
        wine: {
          name: query,
          description_word: description_word,
          message: "データベースにないワインですが、感想を生成しました"
        }
      }
    else
      # 複数ヒットした場合は最初の結果を返す
      wine = wines.first
      render json: { wine: wine }
    end
  end

  private

  def generate_description_from_name(wine_name)
    # 名前から特徴を推測して感想を生成
    name_lower = wine_name.downcase
    
    case name_lower
    when /bordeaux|margaux|medoc|ボルドー|マルゴー/
      ["威厳", "格調", "堂々", "風格"].sample
    when /burgundy|bourgogne|ブルゴーニュ/
      ["繊細", "優雅", "魅惑", "官能"].sample
    when /champagne|シャンパーニュ|dom.?perignon|ドンペリ/
      ["華麗", "祝祭", "きらめき", "泡立ち"].sample
    when /chablis|シャブリ/
      ["凛とした", "透明感", "ミネラル", "清澄"].sample
    when /chianti|barolo|brunello|キャンティ|バローロ/
      ["陽気", "情熱", "力強い", "躍動"].sample
    when /riesling|gewurztraminer|リースリング/
      ["爽やか", "香り高い", "軽快", "フルーティ"].sample
    when /pinot.?noir|ピノノワール/
      ["エレガント", "繊細", "上品", "洗練"].sample
    when /cabernet|カベルネ/
      ["重厚", "濃厚", "パワフル", "骨格"].sample
    when /chardonnay|シャルドネ/
      ["まろやか", "クリーミー", "豊潤", "バランス"].sample
    when /rose|ロゼ/
      ["可憐", "桜色", "春めく", "ロマンチック"].sample
    when /sparkling|スパークリング/
      ["弾ける", "喜び", "躍る", "爽快"].sample
    when /red|赤/
      ["深い", "芳醇", "コクのある", "温かい"].sample
    when /white|白/
      ["爽やか", "すっきり", "清らか", "軽やか"].sample
    else
      ["個性的", "ユニーク", "印象的", "魅力的", "特別", "心地よい"].sample
    end
  end
end