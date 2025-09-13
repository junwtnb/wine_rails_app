class CreateWines < ActiveRecord::Migration[8.0]
  def change
    create_table :wines do |t|
      t.string :name
      t.string :description_word

      t.timestamps
    end
  end
end
