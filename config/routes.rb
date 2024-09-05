Rails.application.routes.draw do
  devise_for :users,
             controllers: {
                 sessions: 'users/sessions',
                 registrations: 'users/registrations'
             },
             defaults: { format: :json }
  
  post 'refresh_token', to: 'tokens#refresh'
  get 'leaderboard', to: 'leaderboard#index'
end
