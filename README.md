# Creating the Arena Project

## 1. Create a new Rails project

```
rails new arena --database=sqlite3
cd arena
```

## 2. Update Gemfile

Add the following gems to your Gemfile:

```ruby
gem 'devise'
gem 'devise-jwt'
gem 'rack-cors'
gem 'dotenv-rails', groups: [:development, :test]
gem 'jsonapi-serializer'
```

## 3. Install dependencies

```
bundle install
```

## 4. Configure Devise

```
rails generate devise:install
```

## 5. Create User model

```
rails generate devise User
```

## 6. Add refresh token to User

```
rails generate migration AddRefreshTokenToUsers refresh_token:string
```

## 7. Update User model

Update `app/models/user.rb`:

```ruby
class User < ApplicationRecord
  include Devise::JWT::RevocationStrategies::JTIMatcher
  
  devise :database_authenticatable, :registerable,
         :jwt_authenticatable, jwt_revocation_strategy: self

  validates :score, numericality: { greater_than_or_equal_to: 0 }

  def generate_refresh_token
    SecureRandom.hex(32)
  end
end
```

## 8. Configure Devise initializer

Update `config/initializers/devise.rb`:

```ruby
Devise.setup do |config|
  # ... other configurations ...

  config.jwt do |jwt|
    jwt.secret = ENV['DEVISE_JWT_SECRET_KEY']
    jwt.dispatch_requests = [
      ['POST', %r{^/login$}]
    ]
    jwt.revocation_requests = [
      ['DELETE', %r{^/logout$}]
    ]
    jwt.expiration_time = 15.minutes.to_i
  end
end
```

## 9. Configure CORS

Create `config/initializers/cors.rb`:

```ruby
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins '*'
    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      expose: ['Authorization']
  end
end
```

## 10. Update routes

Update `config/routes.rb`:

```ruby
Rails.application.routes.draw do
  devise_for :users,
             controllers: {
                 sessions: 'users/sessions',
                 registrations: 'users/registrations'
             }
  post 'refresh_token', to: 'tokens#refresh'
  get 'leaderboard', to: 'leaderboard#index'
end
```

## 11. Create custom Devise controllers

Create `app/controllers/users/registrations_controller.rb`:

```ruby
class Users::RegistrationsController < Devise::RegistrationsController
  respond_to :json

  private

  def respond_with(resource, _opts = {})
    if resource.persisted?
      render json: {
        status: {code: 200, message: 'Signed up successfully.'},
        data: UserSerializer.new(resource).serializable_hash[:data][:attributes]
      }
    else
      render json: {
        status: {message: "User couldn't be created successfully. #{resource.errors.full_messages.to_sentence}"}
      }, status: :unprocessable_entity
    end
  end
end
```

## 12. Create LeaderboardController

Create `app/controllers/leaderboard_controller.rb`:

```ruby
class LeaderboardController < ApplicationController
  def index
    @users = User.order(score: :desc).limit(10)
    render json: @users.as_json(only: [:id, :email, :score])
  end
end
```

## 13. Create UserSerializer

Create `app/serializers/user_serializer.rb`:

```ruby
class UserSerializer
  include JSONAPI::Serializer
  attributes :id, :email, :created_at
end
```

## 14. Update database configuration

Update `config/database.yml`:

```yaml
default: &default
  adapter: sqlite3
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>
  timeout: 5000

development:
  <<: *default
  database: db/development.sqlite3

test:
  <<: *default
  database: db/test.sqlite3

production:
  <<: *default
  database: db/production.sqlite3
```

## 15. Run migrations

```
rails db:migrate
```

## 16. Set up environment variables

Create a `.env` file in the root directory and add:

```
DEVISE_JWT_SECRET_KEY=your_secret_key_here
```

Replace `your_secret_key_here` with a secure random string.

## 17. Update application configuration

In `config/application.rb`, add:

```ruby
module Arena
  class Application < Rails::Application
    # ... other configurations ...
    config.active_record.schema_format = :sql
  end
end
```

## 18. Set up Docker (optional)

Create a `Dockerfile` in the root directory:

```dockerfile
# syntax = docker/dockerfile:1

# Make sure RUBY_VERSION matches the Ruby version in .ruby-version and Gemfile
ARG RUBY_VERSION=3.2.0
FROM ruby:$RUBY_VERSION-slim as base

# Rails app lives here
WORKDIR /rails

# Set production environment
ENV RAILS_ENV="production" \
    BUNDLE_WITHOUT="development:test" \
    BUNDLE_DEPLOYMENT="1"

# Update gems and bundler
RUN gem update --system --no-document && \
    gem install -N bundler


# Throw-away build stage to reduce size of final image
FROM base as build

# Install packages needed to build gems
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential libpq-dev

# Install application gems
COPY --link Gemfile Gemfile.lock ./
RUN bundle install && \
    bundle exec bootsnap precompile --gemfile && \
    rm -rf ~/.bundle/ $BUNDLE_PATH/ruby/*/cache $BUNDLE_PATH/ruby/*/bundler/gems/*/.git

# Copy application code
COPY --link . .

# Precompile bootsnap code for faster boot times
RUN bundle exec bootsnap precompile app/ lib/

# Precompiling assets for production without requiring secret RAILS_MASTER_KEY
RUN SECRET_KEY_BASE=DUMMY ./bin/rails assets:precompile


# Final stage for app image
FROM base

# Install packages needed for deployment
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y curl libsqlite3-0 libvips && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

# Copy built artifacts: gems, application
COPY --from=build /usr/local/bundle /usr/local/bundle
COPY --from=build /rails /rails

# Run and own only the runtime files as a non-root user for security
RUN useradd rails --create-home --shell /bin/bash && \
    chown -R rails:rails db log storage tmp
USER rails:rails

# Entrypoint prepares the database.
ENTRYPOINT ["/rails/bin/docker-entrypoint"]

# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD ["./bin/rails", "server"]
```

Create a `docker-entrypoint` file in the `bin` directory:

```bash
#!/bin/bash -e

# If running the rails server then create or migrate existing database
if [ "${1}" == "./bin/rails" ] && [ "${2}" == "server" ]; then
  ./bin/rails db:prepare
fi

exec "${@}"
```

Make the `docker-entrypoint` file executable:

```
chmod +x bin/docker-entrypoint
```

## 19. Set up Git

Initialize Git repository:

```
git init
```

Create a `.gitignore` file:

```
# See https://help.github.com/articles/ignoring-files for more about ignoring files.
#
# If you find yourself ignoring temporary files generated by your text editor
# or operating system, you probably want to add a global ignore instead:
#   git config --global core.excludesfile '~/.gitignore_global'

# Ignore bundler config.
/.bundle

# Ignore all environment files (except templates).
/.env*
!/.env*.erb

# Ignore all logfiles and tempfiles.
/log/*
/tmp/*
!/log/.keep
!/tmp/.keep

# Ignore pidfiles, but keep the directory.
/tmp/pids/*
!/tmp/pids/
!/tmp/pids/.keep

# Ignore storage (uploaded files in development and any SQLite databases).
/storage/*
!/storage/.keep
/tmp/storage/*
!/tmp/storage/
!/tmp/storage/.keep

/public/assets

# Ignore master key for decrypting credentials and more.
/config/master.key
```

## 20. Final steps

- Review and adjust the configuration files as needed.
- Implement any additional features or customizations.
- Set up your development, testing, and production environments.
- Write tests for your models and controllers.

This detailed documentation provides a step-by-step guide to recreate the Arena project from scratch. Remember to adjust any configurations or code to fit your specific requirements.




Certainly! Here are the CURL commands to test the user registration, login, and leaderboard API endpoints:

1. User Registration:
```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "email": "test@example.com",
      "password": "password123",
      "password_confirmation": "password123"
    }
  }'
```

2. User Login:
```bash
curl -X POST http://localhost:3000/users/sign_in \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "email": "test@example.com",
      "password": "password123"
    }
  }'
```
Note: After a successful login, you'll receive a JWT token in the `Authorization` header. You'll need this token for authenticated requests.

3. Get Leaderboard:
```bash
curl -X GET http://localhost:3000/leaderboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```
Replace `YOUR_JWT_TOKEN_HERE` with the actual JWT token you received from the login response.

4. Refresh Token (if implemented):
```bash
curl -X POST http://localhost:3000/refresh_token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN_HERE"
  }'
```
Replace `YOUR_JWT_TOKEN_HERE` with your current JWT token and `YOUR_REFRESH_TOKEN_HERE` with your refresh token.

5. User Logout:
```bash
curl -X DELETE http://localhost:3000/users/sign_out \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```
Replace `YOUR_JWT_TOKEN_HERE` with your current JWT token.

Remember to replace `http://localhost:3000` with your actual server address if it's different. Also, make sure your Rails server is running when you test these endpoints.

These CURL commands should help you test the basic functionality of your user authentication and leaderboard API. You may need to adjust the endpoints or payload structure if you've customized your routes or controllers.




rails generate migration AddScoreToUsers score:integer
rails generate migration AddJtiToUsers jti:string:index