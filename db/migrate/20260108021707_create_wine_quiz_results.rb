class CreateWineQuizResults < ActiveRecord::Migration[8.0]
  def change
    create_table :wine_quiz_results do |t|
      t.string :session_id
      t.integer :score
      t.integer :total_questions
      t.integer :correct_answers
      t.integer :difficulty
      t.datetime :completed_at
      t.integer :time_taken

      t.timestamps
    end
  end
end
