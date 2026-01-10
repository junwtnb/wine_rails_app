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

# 初級問題を追加
WineQuizQuestion.find_or_create_by!(
  question: "白ワインに使われる代表的なブドウ品種はどれですか？",
  correct_answer: "A",
  option_a: "シャルドネ",
  option_b: "カベルネ・ソーヴィニヨン",
  option_c: "ピノ・ノワール",
  option_d: "シラー",
  difficulty: 2,
  category: "品種",
  explanation: "シャルドネは世界中で栽培される白ワインの代表的なブドウ品種です。"
)

WineQuizQuestion.find_or_create_by!(
  question: "赤ワインに使われる代表的なブドウ品種はどれですか？",
  correct_answer: "B",
  option_a: "リースリング",
  option_b: "カベルネ・ソーヴィニヨン",
  option_c: "ソーヴィニヨン・ブラン",
  option_d: "ピノ・グリ",
  difficulty: 2,
  category: "品種",
  explanation: "カベルネ・ソーヴィニヨンは世界中で愛される赤ワインの代表的品種です。"
)

WineQuizQuestion.find_or_create_by!(
  question: "イタリアの有名なワイン産地といえば？",
  correct_answer: "C",
  option_a: "ナパ・バレー",
  option_b: "ボルドー",
  option_c: "トスカーナ",
  option_d: "シャンパーニュ",
  difficulty: 2,
  category: "地域",
  explanation: "トスカーナはキャンティなどで有名なイタリアの代表的なワイン産地です。"
)

WineQuizQuestion.find_or_create_by!(
  question: "ドイツのワインといえば主にどの品種が有名ですか？",
  correct_answer: "D",
  option_a: "カベルネ・ソーヴィニヨン",
  option_b: "シャルドネ",
  option_c: "ピノ・ノワール",
  option_d: "リースリング",
  difficulty: 2,
  category: "品種",
  explanation: "リースリングはドイツを代表する白ブドウ品種で、上品な酸味が特徴です。"
)

WineQuizQuestion.find_or_create_by!(
  question: "ワインの「ボディ」とは何を表しますか？",
  correct_answer: "A",
  option_a: "味わいの重さや濃厚さ",
  option_b: "ワインの色の濃さ",
  option_c: "アルコール度数",
  option_d: "酸味の強さ",
  difficulty: 2,
  category: "基礎知識",
  explanation: "ボディはワインの味わいの重さや濃厚さを表現する用語です。"
)

WineQuizQuestion.find_or_create_by!(
  question: "スパークリングワインの泡はどうやってできますか？",
  correct_answer: "B",
  option_a: "炭酸ガスを注入",
  option_b: "発酵によるガス",
  option_c: "攪拌による泡立て",
  option_d: "冷却による結晶化",
  difficulty: 2,
  category: "製造",
  explanation: "スパークリングワインの泡は発酵過程で生じる炭酸ガスによって作られます。"
)

WineQuizQuestion.find_or_create_by!(
  question: "ワイングラスを持つときの正しい位置は？",
  correct_answer: "C",
  option_a: "ボウル部分",
  option_b: "リム部分",
  option_c: "ステム部分",
  option_d: "ベース部分",
  difficulty: 2,
  category: "テイスティング",
  explanation: "ステム（脚）部分を持つことで、手の温度がワインに伝わるのを防げます。"
)

WineQuizQuestion.find_or_create_by!(
  question: "ロゼワインはどうやって作られますか？",
  correct_answer: "A",
  option_a: "黒ブドウを短時間だけ皮と接触させる",
  option_b: "赤ワインと白ワインを混ぜる",
  option_c: "白ブドウに食紅を加える",
  option_d: "特別なピンクのブドウを使う",
  difficulty: 2,
  category: "製造",
  explanation: "ロゼワインは黒ブドウを短時間だけ皮と接触させて色をつけて作ります。"
)

WineQuizQuestion.find_or_create_by!(
  question: "カリフォルニアの有名なワイン産地は？",
  correct_answer: "B",
  option_a: "ソノマ・カウンティのみ",
  option_b: "ナパ・バレー",
  option_c: "ロサンゼルス",
  option_d: "サンフランシスコ",
  difficulty: 2,
  category: "地域",
  explanation: "ナパ・バレーはカリフォルニアを代表する世界的に有名なワイン産地です。"
)

WineQuizQuestion.find_or_create_by!(
  question: "ワインのアルコール度数は通常何％くらいですか？",
  correct_answer: "C",
  option_a: "5-8%",
  option_b: "8-10%",
  option_c: "12-15%",
  option_d: "18-20%",
  difficulty: 2,
  category: "基礎知識",
  explanation: "一般的なワインのアルコール度数は12-15%程度です。"
)

puts "✅ ワインクイズ問題を#{WineQuizQuestion.count}件作成しました！"