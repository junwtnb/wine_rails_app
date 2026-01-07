class CreateWineInteractions < ActiveRecord::Migration[8.0]
  def change
    create_table :wine_interactions do |t|
      t.string :session_id
      t.string :wine_name
      t.string :wine_type
      t.string :description_word
      t.datetime :searched_at
      t.string :region_country
      t.integer :vintage_year

      t.timestamps
    end
  end
end
