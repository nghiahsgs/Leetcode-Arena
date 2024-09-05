class User < ApplicationRecord
  include Devise::JWT::RevocationStrategies::JTIMatcher
  
  devise :database_authenticatable, :registerable,
         :jwt_authenticatable, jwt_revocation_strategy: self

  validates :score, numericality: { greater_than_or_equal_to: 0 }

  after_initialize :set_default_score, if: :new_record?

  def generate_refresh_token
    SecureRandom.hex(32)
  end

  private

  def set_default_score
    self.score ||= 0
  end
end