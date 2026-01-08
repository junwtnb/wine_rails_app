# Wine Quiz Questions Seed Data

# 基礎知識
WineQuizQuestion.find_or_create_by!(
  question: "赤ワインの色の成分は何ですか？",
  correct_answer: "B",
  option_a: "タンニン",
  option_b: "アントシアニン",
  option_c: "リンゴ酸",
  option_d: "アルコール",
  difficulty: 3,
  category: "基礎知識",
  explanation: "アントシアニンはブドウの皮に含まれる色素で、赤ワインの美しい色を作り出します。"
)

WineQuizQuestion.find_or_create_by!(
  question: "ワインの「テロワール」とは何を指しますか？",
  correct_answer: "A",
  option_a: "土壌・気候・地形などの自然環境",
  option_b: "ワインメーカーの技術",
  option_c: "ブドウの品種",
  option_d: "醸造方法",
  difficulty: 3,
  category: "基礎知識",
  explanation: "テロワールとは土壌、気候、地形、生態系などワインに影響を与える自然環境の総称です。"
)

WineQuizQuestion.find_or_create_by!(
  question: "ワインの適正保存温度は？",
  correct_answer: "B",
  option_a: "5-8℃",
  option_b: "12-15℃",
  option_c: "18-22℃",
  option_d: "25-30℃",
  difficulty: 1,
  category: "基礎知識",
  explanation: "ワインは12-15℃で保存するのが理想的です。温度変化も避けましょう。"
)

# 地域
WineQuizQuestion.find_or_create_by!(
  question: "シャンパーニュ地方はフランスのどの地域にありますか？",
  correct_answer: "A",
  option_a: "北東部",
  option_b: "南西部",
  option_c: "南東部",
  option_d: "北西部",
  difficulty: 2,
  category: "地域",
  explanation: "シャンパーニュ地方はフランス北東部に位置し、パリから約150km東にあります。"
)

WineQuizQuestion.find_or_create_by!(
  question: "ボルドーの「5大シャトー」に含まれないのは？",
  correct_answer: "D",
  option_a: "シャトー・ラフィット",
  option_b: "シャトー・マルゴー",
  option_c: "シャトー・ムートン",
  option_d: "シャトー・ディケム",
  difficulty: 4,
  category: "地域",
  explanation: "シャトー・ディケムは貴腐ワインの名門で、5大シャトーには含まれません。"
)

# 品種
WineQuizQuestion.find_or_create_by!(
  question: "ピノ・ノワールの原産地はどこですか？",
  correct_answer: "C",
  option_a: "ボルドー",
  option_b: "トスカーナ",
  option_c: "ブルゴーニュ",
  option_d: "ナパ・バレー",
  difficulty: 2,
  category: "品種",
  explanation: "ピノ・ノワールはブルゴーニュ地方原産の品種で、世界中で栽培されています。"
)

WineQuizQuestion.find_or_create_by!(
  question: "日本の代表的な白ブドウ品種は？",
  correct_answer: "C",
  option_a: "リースリング",
  option_b: "シャルドネ",
  option_c: "甲州",
  option_d: "ソーヴィニヨン・ブラン",
  difficulty: 2,
  category: "品種",
  explanation: "甲州は日本固有の品種で、山梨県を中心に栽培されています。"
)

# テイスティング
WineQuizQuestion.find_or_create_by!(
  question: "ワインテイスティングの正しい順序は？",
  correct_answer: "A",
  option_a: "外観→香り→味わい",
  option_b: "香り→外観→味わい",
  option_c: "味わい→香り→外観",
  option_d: "香り→味わい→外観",
  difficulty: 1,
  category: "テイスティング",
  explanation: "まず外観で色や透明度を確認し、次に香りを楽しみ、最後に味わいを評価します。"
)

# 製造
WineQuizQuestion.find_or_create_by!(
  question: "マロラクティック発酵の効果は？",
  correct_answer: "B",
  option_a: "アルコール度数を上げる",
  option_b: "酸味をまろやかにする",
  option_c: "色を濃くする",
  option_d: "香りを強くする",
  difficulty: 4,
  category: "製造",
  explanation: "マロラクティック発酵によりリンゴ酸が乳酸に変換され、酸味がまろやかになります。"
)

# 歴史
WineQuizQuestion.find_or_create_by!(
  question: "「ドン・ペリニヨン」で有名なシャンパンハウスはどこですか？",
  correct_answer: "D",
  option_a: "クリュッグ",
  option_b: "ルイ・ロデレール",
  option_c: "ヴーヴ・クリコ",
  option_d: "モエ・エ・シャンドン",
  difficulty: 3,
  category: "歴史",
  explanation: "ドン・ペリニヨンはモエ・エ・シャンドンのプレステージ・キュヴェです。"
)

puts "✅ ワインクイズ問題を#{WineQuizQuestion.count}件作成しました！"