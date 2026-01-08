class CreateWineQuizQuestions < ActiveRecord::Migration[8.0]
  def change
    create_table :wine_quiz_questions do |t|
      t.text :question
      t.string :correct_answer
      t.string :option_a
      t.string :option_b
      t.string :option_c
      t.string :option_d
      t.integer :difficulty
      t.string :category
      t.text :explanation

      t.timestamps
    end
  end
end
