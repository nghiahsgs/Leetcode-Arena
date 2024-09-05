class TokensController < ApplicationController
  def refresh
    user = User.find_by(refresh_token: params[:refresh_token])
    if user
      new_token = user.generate_jwt
      new_refresh_token = user.generate_refresh_token
      user.update(refresh_token: new_refresh_token)
      render json: { token: new_token, refresh_token: new_refresh_token }
    else
      render json: { error: 'Invalid refresh token' }, status: :unauthorized
    end
  end
end