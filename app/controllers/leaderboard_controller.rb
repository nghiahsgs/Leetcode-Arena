class LeaderboardController < ApplicationController
  def index
    @users = User.order(score: :desc).limit(10)
    render json: @users.as_json(only: [:id, :email, :score])
  end
end