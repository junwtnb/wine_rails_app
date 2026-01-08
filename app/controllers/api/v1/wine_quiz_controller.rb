class Api::V1::WineQuizController < ApplicationController
  # クイズの問題を取得 (難易度別・カテゴリ別)
  def questions
    difficulty = params[:difficulty]&.to_i || 2
    category = params[:category]
    count = params[:count]&.to_i || 5

    questions = WineQuizQuestion.all
    questions = questions.by_difficulty(difficulty) if difficulty.present?
    questions = questions.by_category(category) if category.present?
    questions = questions.random_questions(count)

    # 回答は含めずに送信
    formatted_questions = questions.map do |q|
      {
        id: q.id,
        question: q.question,
        options: q.options_with_labels,
        difficulty: q.difficulty,
        difficulty_label: q.difficulty_label,
        category: q.category
      }
    end

    render json: {
      questions: formatted_questions,
      total: formatted_questions.count,
      difficulty: difficulty,
      category: category
    }
  rescue => e
    Rails.logger.error "Quiz questions error: #{e.message}"
    render json: { error: "問題の取得に失敗しました" }, status: :internal_server_error
  end

  # クイズ結果を評価・保存
  def submit
    session_id = request.headers['X-Session-ID'] || params[:session_id] || 'anonymous'
    answers = params[:answers] || []
    difficulty = params[:difficulty]&.to_i || 2
    time_taken = params[:time_taken]&.to_i || 0

    return render json: { error: "回答が必要です" }, status: :bad_request if answers.empty?

    # 正答をチェック
    correct_count = 0
    total_questions = answers.length
    results = []

    answers.each do |answer|
      question = WineQuizQuestion.find_by(id: answer[:question_id])
      next unless question

      is_correct = question.correct_answer == answer[:selected_answer]
      correct_count += 1 if is_correct

      results << {
        question_id: question.id,
        question: question.question,
        selected_answer: answer[:selected_answer],
        correct_answer: question.correct_answer,
        is_correct: is_correct,
        explanation: question.explanation,
        options: question.options_with_labels
      }
    end

    # スコア計算 (正答率 × 難易度ボーナス × 時間ボーナス)
    accuracy = (correct_count.to_f / total_questions * 100).round(1)
    difficulty_multiplier = [1.0, 1.0, 1.2, 1.5, 2.0, 3.0][difficulty] || 1.0
    time_bonus = calculate_time_bonus(time_taken, total_questions)
    final_score = (accuracy * difficulty_multiplier * time_bonus).round(0)

    # 結果を保存
    quiz_result = WineQuizResult.create!(
      session_id: session_id,
      score: final_score,
      total_questions: total_questions,
      correct_answers: correct_count,
      difficulty: difficulty,
      completed_at: Time.current,
      time_taken: time_taken
    )

    render json: {
      quiz_result: {
        id: quiz_result.id,
        score: final_score,
        accuracy: accuracy,
        correct_answers: correct_count,
        total_questions: total_questions,
        grade: quiz_result.grade,
        grade_emoji: quiz_result.grade_emoji,
        difficulty: difficulty,
        difficulty_label: quiz_result.difficulty_label,
        time_taken: time_taken,
        time_bonus: time_bonus,
        difficulty_multiplier: difficulty_multiplier
      },
      results: results,
      achievements: check_achievements(session_id, quiz_result)
    }
  rescue => e
    Rails.logger.error "Quiz submit error: #{e.message}"
    render json: { error: "結果の保存に失敗しました" }, status: :internal_server_error
  end

  # ユーザーのクイズ統計情報
  def statistics
    session_id = request.headers['X-Session-ID'] || params[:session_id]
    return render json: { error: "セッションIDが必要です" }, status: :bad_request if session_id.blank?

    stats = WineQuizResult.user_statistics(session_id)

    render json: { statistics: stats }
  rescue => e
    Rails.logger.error "Quiz statistics error: #{e.message}"
    render json: { error: "統計データの取得に失敗しました" }, status: :internal_server_error
  end

  # 利用可能なカテゴリ・難易度一覧
  def options
    render json: {
      categories: WineQuizQuestion::CATEGORIES,
      difficulties: WineQuizQuestion::DIFFICULTIES,
      question_count: WineQuizQuestion.count
    }
  end

  private

  def calculate_time_bonus(time_taken, question_count)
    # 1問あたり30秒を基準とした時間ボーナス (0.8～1.2倍)
    expected_time = question_count * 30
    return 1.2 if time_taken <= expected_time * 0.5
    return 1.1 if time_taken <= expected_time * 0.7
    return 1.0 if time_taken <= expected_time
    return 0.9 if time_taken <= expected_time * 1.5
    0.8
  end

  def check_achievements(session_id, quiz_result)
    achievements = []
    user_results = WineQuizResult.by_session(session_id)

    # パーフェクト達成
    if quiz_result.accuracy_percentage == 100
      achievements << {
        title: "パーフェクト！",
        description: "全問正解を達成しました！",
        emoji: "🎯",
        type: "perfect"
      }
    end

    # 初回クリア
    if user_results.count == 1
      achievements << {
        title: "ワイン知識の探求者",
        description: "初回クイズ完了おめでとうございます！",
        emoji: "🍷",
        type: "first_quiz"
      }
    end

    # 連続クリア
    if user_results.count >= 5
      achievements << {
        title: "ワイン通",
        description: "5回以上のクイズ挑戦！",
        emoji: "📚",
        type: "frequent_player"
      }
    end

    # 高スコア
    if quiz_result.score >= 150
      achievements << {
        title: "ワインエキスパート",
        description: "高スコアを達成しました！",
        emoji: "👨‍🎓",
        type: "high_score"
      }
    end

    achievements
  end
end
