class Api::V1::WinesController < ApplicationController
  def index
    wines = Wine.all
    render json: wines
  end

  def show
    wine = Wine.find(params[:id])
    render json: wine
  rescue ActiveRecord::RecordNotFound
    render json: { error: "ワインが見つかりません" }, status: :not_found
  end

  def create
    wine = Wine.new(wine_params)

    if wine.save
      render json: {
        wine: wine,
        message: "ワインの感想を追加しました"
      }, status: :created
    else
      render json: {
        errors: wine.errors.full_messages,
        message: "追加に失敗しました"
      }, status: :unprocessable_entity
    end
  end

  def search_by_name
    query = params[:query]
    return render json: { error: "検索クエリが必要です" }, status: :bad_request if query.blank?

    wines = Wine.search_by_name(query)

    if wines.empty?
      # 検索でヒットしなかった場合、新しい感想を生成
      description_word, is_generic = generate_description_from_name(query)
      tasting_notes = generate_detailed_tasting_notes(query)
      region_info = detect_wine_region(query)
      message = if is_generic
        "このワインの詳細情報が不足しているため、一般的な特徴から感想を生成しています。より具体的な情報（生産者名・ヴィンテージ・品種名など）があれば、より個別的な感想を生成できます。"
      else
        "入力いただいた特徴から感想を生成しました"
      end

      render json: {
        wine: {
          name: query,
          description_word: description_word,
          tasting_notes: tasting_notes,
          message: message,
          is_generic: is_generic,
          region: region_info
        }
      }
    else
      # 複数ヒットした場合は最新ヴィンテージを優先的に返す
      wine = wines.order(vtg: :desc, created_at: :desc).first
      # ヴィンテージに応じた感想を生成
      enhanced_description = enhance_description_with_vintage(wine)
      region_info = detect_wine_region(wine.name || query)
      render json: {
        wine: {
          name: wine.name,
          description_word: enhanced_description,
          vtg: wine.vtg,
          message: wine.vtg ? "データベースから見つかりました（#{wine.vtg}年）" : "データベースから見つかりました",
          region: region_info
        }
      }
    end
  end

  private

  def wine_params
    params.require(:wine).permit(:name, :description_word, :vtg)
  end

  def enhance_description_with_vintage(wine)
    base_description = wine.description_word
    vintage_category = wine.vintage_category

    return base_description if vintage_category.nil?

    case vintage_category
    when :very_recent
      "フレッシュな#{base_description}"
    when :recent
      "若々しい#{base_description}"
    when :mature
      "熟成した#{base_description}"
    when :aged
      "円熟の#{base_description}"
    when :vintage
      "歴史ある#{base_description}"
    else
      base_description
    end
  end

  def detect_wine_region(wine_name)
    name_lower = wine_name.downcase

    case name_lower
    when /bordeaux|margaux|medoc|saint.?estephe|pauillac|saint.?julien|ボルドー|マルゴー|メドック/
      {
        name: "ボルドー",
        country: "フランス",
        coordinates: { lat: 44.8378, lng: -0.5792 },
        description: "世界最高級ワインの聖地"
      }
    when /burgundy|bourgogne|chablis|gevrey|chambertin|ブルゴーニュ|シャブリ/
      {
        name: "ブルゴーニュ",
        country: "フランス",
        coordinates: { lat: 47.0516, lng: 4.8555 },
        description: "繊細で複雑な味わいの名産地"
      }
    when /champagne|reims|epernay|シャンパーニュ|ランス|エペルネ/
      {
        name: "シャンパーニュ",
        country: "フランス",
        coordinates: { lat: 49.0370, lng: 4.0432 },
        description: "スパークリングワインの故郷"
      }
    when /loire|sancerre|muscadet|ロワール|サンセール/
      {
        name: "ロワール",
        country: "フランス",
        coordinates: { lat: 47.2383, lng: 1.0888 },
        description: "川沿いの多様なワイン産地"
      }
    when /rhone|cotes.?du.?rhone|hermitage|ローヌ|エルミタージュ/
      {
        name: "ローヌ",
        country: "フランス",
        coordinates: { lat: 44.1867, lng: 4.8089 },
        description: "力強い赤ワインの産地"
      }
    when /chianti|barolo|brunello|tuscany|キャンティ|バローロ|トスカーナ/
      {
        name: "トスカーナ/ピエモンテ",
        country: "イタリア",
        coordinates: { lat: 43.4643, lng: 11.8811 },
        description: "イタリア最高峰ワインの故郷"
      }
    when /rioja|ribera|tempranillo|リオハ|テンプラニーロ/
      {
        name: "リオハ",
        country: "スペイン",
        coordinates: { lat: 42.4627, lng: -2.4451 },
        description: "スペイン王室御用達の銘醸地"
      }
    when /napa|sonoma|california|ナパ|ソノマ|カリフォルニア/
      {
        name: "ナパバレー/ソノマ",
        country: "アメリカ",
        coordinates: { lat: 38.5025, lng: -122.2654 },
        description: "アメリカワインの聖地"
      }
    when /mendoza|argentina|メンドーサ|アルゼンチン/
      {
        name: "メンドーサ",
        country: "アルゼンチン",
        coordinates: { lat: -32.8908, lng: -68.8272 },
        description: "高地で育つマルベックの名産地"
      }
    when /chile|central.?valley|チリ|セントラルバレー/
      {
        name: "セントラルバレー",
        country: "チリ",
        coordinates: { lat: -34.1689, lng: -70.7416 },
        description: "コストパフォーマンスに優れた産地"
      }
    when /australia|barossa|adelaide|オーストラリア|バロッサ/
      {
        name: "バロッサバレー",
        country: "オーストラリア",
        coordinates: { lat: -34.5598, lng: 138.9156 },
        description: "力強いシラーズの故郷"
      }
    when /germany|mosel|rheingau|ドイツ|モーゼル|ラインガウ/
      {
        name: "モーゼル/ラインガウ",
        country: "ドイツ",
        coordinates: { lat: 49.9754, lng: 6.6499 },
        description: "エレガントなリースリングの産地"
      }
    when /alsace|アルザス/
      {
        name: "アルザス",
        country: "フランス",
        coordinates: { lat: 48.5734, lng: 7.7521 },
        description: "フルーティで香り豊かな白ワインの名産地"
      }
    when /yamanashi|山梨|甲府|勝沼|koshu|コシュ/
      {
        name: "山梨",
        country: "日本",
        coordinates: { lat: 35.6638, lng: 138.5681 },
        description: "日本ワインの発祥地、甲州ブドウの故郷"
      }
    when /nagano|長野|塩尻|千曲川|信州/
      {
        name: "長野",
        country: "日本",
        coordinates: { lat: 36.2048, lng: 138.1813 },
        description: "冷涼な気候が育む上質な日本ワイン"
      }
    when /hokkaido|北海道|余市|富良野|十勝/
      {
        name: "北海道",
        country: "日本",
        coordinates: { lat: 43.2203, lng: 142.8635 },
        description: "冷涼な気候で育つエレガントなワイン"
      }
    when /stellenbosch|paarl|constantia|south.africa|南アフリカ|ステレンボッシュ|パール/
      {
        name: "ステレンボッシュ",
        country: "南アフリカ",
        coordinates: { lat: -33.9321, lng: 18.8602 },
        description: "アフリカ大陸最高峰のワイン産地"
      }
    when /marlborough|hawkes.bay|new.zealand|ニュージーランド|マールボロ|ホークスベイ/
      {
        name: "マールボロ",
        country: "ニュージーランド",
        coordinates: { lat: -41.5205, lng: 174.0000 },
        description: "世界最高峰のソーヴィニヨン・ブランの産地"
      }
    when /douro|vinho.verde|portugal|ポルトガル|ドウロ|ヴィーニョヴェルデ/
      {
        name: "ドウロ",
        country: "ポルトガル",
        coordinates: { lat: 41.1579, lng: -7.7956 },
        description: "ポートワインとドウロワインの故郷"
      }
    else
      nil
    end
  end

  def generate_detailed_tasting_notes(wine_name)
    # 香り・味わい・余韻の詳細なテイスティングノートを生成
    name_lower = wine_name.downcase
    is_generic = false

    case name_lower
    when /bordeaux|margaux|medoc|ボルドー|マルゴー/
      {
        aroma: ["ブラックカラント", "杉", "バニラ", "スパイス"].sample,
        taste: ["重厚", "格調高い", "タンニンしっかり", "風格ある"].sample,
        finish: ["長く複雑な", "エレガントな", "力強い", "印象的な"].sample
      }
    when /burgundy|bourgogne|ブルゴーニュ/
      {
        aroma: ["赤い果実", "薔薇", "土の香り", "きのこ"].sample,
        taste: ["繊細", "シルキー", "官能的", "複雑"].sample,
        finish: ["上品で長い", "余韻美しい", "魅惑的な", "優雅な"].sample
      }
    when /champagne|シャンパーニュ/
      {
        aroma: ["柑橘", "花の蜜", "ブリオッシュ", "ミネラル"].sample,
        taste: ["きめ細かい泡", "華やか", "爽やか", "祝祭的"].sample,
        finish: ["爽快で清涼", "泡立ちが心地よい", "きらめく", "喜びあふれる"].sample
      }
    when /chablis|シャブリ/
      {
        aroma: ["青リンゴ", "貝殻", "レモン", "石灰"].sample,
        taste: ["ミネラル豊か", "凛とした", "透明感", "クリスピー"].sample,
        finish: ["清廉で長い", "潮風のような", "清涼感", "純粋な"].sample
      }
    when /chianti|barolo|brunello|キャンティ|バローロ/
      {
        aroma: ["チェリー", "ローズマリー", "革", "トリュフ"].sample,
        taste: ["陽気", "力強い", "温かみ", "情熱的"].sample,
        finish: ["躍動感ある", "太陽の恵み", "イタリアらしい", "心躍る"].sample
      }
    when /riesling|gewurztraminer|リースリング/
      {
        aroma: ["白い花", "蜂蜜", "ライチ", "石油香"].sample,
        taste: ["フルーティ", "軽やか", "香り高い", "爽快"].sample,
        finish: ["花のような", "アロマティック", "上品な甘み", "華やか"].sample
      }
    # 日本ワイン
    when /japan|日本|yamanashi|山梨|koshu|甲州|勝沼/
      {
        aroma: ["柚子", "白い花", "和梨", "緑茶"].sample,
        taste: ["繊細", "和の心", "上品", "優しい"].sample,
        finish: ["清楚な", "日本らしい", "品のある", "心落ち着く"].sample
      }
    when /nagano|長野|塩尻|信州/
      {
        aroma: ["高原の風", "りんご", "山桜", "清流"].sample,
        taste: ["透明感", "高原の恵み", "清廉", "澄みきった"].sample,
        finish: ["高原を思わせる", "爽やかな風", "山の恵み", "自然の調和"].sample
      }
    when /hokkaido|北海道|余市|富良野/
      {
        aroma: ["雪解け水", "白樺", "ラベンダー", "冷涼な風"].sample,
        taste: ["清涼", "純粋", "北の大地", "凛とした"].sample,
        finish: ["雪のような純白", "北海道らしい", "清々しい", "大自然の恵み"].sample
      }
    else
      is_generic = true
      {
        aroma: ["果実", "花", "スパイス", "ミネラル"].sample,
        taste: ["個性的", "バランス良い", "心地よい", "印象的"].sample,
        finish: ["満足感のある", "記憶に残る", "特別な", "魅力的な"].sample
      }
    end
  end

  def generate_description_from_name(wine_name)
    # 名前から特徴を推測して感想を生成
    name_lower = wine_name.downcase
    is_generic = false

    description = case name_lower
    when /bordeaux|margaux|medoc|ボルドー|マルゴー/
      [ "威厳", "格調", "堂々", "風格" ].sample
    when /burgundy|bourgogne|ブルゴーニュ/
      [ "繊細", "優雅", "魅惑", "官能" ].sample
    when /champagne|シャンパーニュ|dom.?perignon|ドン[・]?ペリ/
      [ "華麗", "祝祭", "きらめき", "泡立ち" ].sample
    when /chablis|シャブリ/
      [ "凛とした", "透明感", "ミネラル", "清澄" ].sample
    when /chianti|barolo|brunello|キャンティ|バローロ/
      [ "陽気", "情熱", "力強い", "躍動" ].sample
    when /riesling|gewurztraminer|リースリング|ゲヴュルツ[・]?トラミネール/
      [ "爽やか", "香り高い", "軽快", "フルーティ" ].sample
    when /pinot.?noir|ピノ[・]?ノワール/
      [ "エレガント", "繊細", "上品", "洗練" ].sample
    when /pinot.?gris|pinot.?grigio|ピノ[・]?グリ|ピノグリージョ/
      [ "さっぱり", "ドライ", "洗練", "すっきり" ].sample
    when /cabernet|カベルネ[・]?ソーヴィニヨン|カベルネ/
      [ "重厚", "濃厚", "パワフル", "骨格" ].sample
    when /chardonnay|シャルドネ/
      [ "まろやか", "クリーミー", "豊潤", "バランス" ].sample
    when /sparkling|スパークリング/
      [ "弾ける", "喜び", "躍る", "爽快" ].sample
    when /red|赤|rouge|ルージュ/
      [ "深い", "芳醇", "コクのある", "温かい" ].sample
    when /white|白|blanc|ブラン/
      [ "爽やか", "すっきり", "清らか", "軽やか" ].sample
    when /rosé|ロゼ/
      [ "可憐", "桜色", "春めく", "ロマンチック" ].sample
    when /mousseux|ムスー|crémant|クレマン/
      [ "弾ける", "軽やか", "泡立ち", "爽快" ].sample
    when /sec|セック/
      [ "ドライ", "キレ", "すっきり", "辛口" ].sample
    when /doux|ドゥー|moelleux|モワルー/
      [ "甘美", "まろやか", "蜜のような", "甘口" ].sample
    when /millésime|ミレジム/
      [ "ヴィンテージ", "年代物", "熟成", "貴重" ].sample
    # フランス地名
    when /savigny|savigny.les.beaune|サヴィニー[・]?レ[・]?ボーヌ/
      [ "エレガント", "繊細", "気品", "洗練" ].sample
    when /gevrey.chambertin|ジュヴレ[・]?シャンベルタン/
      [ "力強い", "威厳", "堂々", "深遠" ].sample
    when /chassagne.montrachet|シャサーニュ[・]?モンラッシェ/
      [ "気高い", "複雑", "豊潤", "格調" ].sample
    when /mercurey|メルキュレ/
      [ "バランス", "上品", "調和", "優美" ].sample
    when /alsace|アルザス/
      [ "フルーティ", "アロマティック", "華やか", "香り豊か" ].sample
    # 国名
    when /france|フランス/
      [ "エレガント", "洗練", "気品", "伝統" ].sample
    when /italy|italia|イタリア/
      [ "陽気", "情熱", "温かい", "親しみやすい" ].sample
    when /spain|españa|スペイン/
      [ "力強い", "情熱的", "太陽の恵み", "豊潤" ].sample
    when /germany|ドイツ/
      [ "精密", "繊細", "ミネラル", "クリア" ].sample
    when /california|カリフォルニア/
      [ "陽光", "豊か", "モダン", "果実味" ].sample
    when /australia|オーストラリア/
      [ "パワフル", "フレッシュ", "躍動感", "新世界" ].sample
    when /chile|チリ/
      [ "コスパ", "親しみやすい", "フルーティ", "カジュアル" ].sample
    when /argentina|アルゼンチン/
      [ "情熱", "濃厚", "力強い", "ダイナミック" ].sample
    # 日本
    when /japan|日本|yamanashi|山梨|koshu|甲州|勝沼/
      [ "繊細", "和の心", "上品", "清楚" ].sample
    when /nagano|長野|塩尻|信州/
      [ "清廉", "透明感", "高原の恵み", "純粋" ].sample
    when /hokkaido|北海道|余市|富良野/
      [ "清涼", "爽快", "北の大地", "純白" ].sample
    # 南半球
    when /south.africa|南アフリカ|stellenbosch|ステレンボッシュ/
      [ "野性的", "大地の力", "アフリカの太陽", "情熱的" ].sample
    when /new.zealand|ニュージーランド|marlborough|マールボロ/
      [ "清澄", "南十字星", "自然派", "ピュア" ].sample
    when /portugal|ポルトガル|douro|ドウロ/
      [ "伝統的", "歴史の重み", "深遠", "古典的" ].sample
    else
      is_generic = true
      [ "個性的", "ユニーク", "印象的", "魅力的", "特別", "心地よい" ].sample
    end

    [ description, is_generic ]
  end
end
