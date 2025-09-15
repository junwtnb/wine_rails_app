class AddVtgToWines < ActiveRecord::Migration[8.0]
  def change
    add_column :wines, :vtg, :integer
  end
end
