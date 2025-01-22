# Makefile
.PHONY: all install setup-nginx setup-db setup-node setup-service clean

# Configuration variables
NODE_VERSION := 18
PROJECT_PATH := /opt/ponder.veil.cash
NGINX_CONF := /etc/nginx/sites-available/ponder.guarpcast.com
DB_NAME := ponder_veil
DB_USER := ponder_user
DB_PASS := $(shell openssl rand -hex 16)
DOMAIN := ponder.guarpcast.com

all: install setup-nginx setup-db setup-node setup-project setup-service
	@echo "Installation completed. Check the service status with: sudo systemctl status veil-ponder"
	@echo "View logs with: sudo journalctl -u veil-ponder -f"
	@echo "The service should be available at https://$(DOMAIN) once DNS is configured"

install:
	@echo "Installing system dependencies..."
	sudo apt-get update
	sudo apt-get install -y nginx postgresql postgresql-contrib certbot python3-certbot-nginx git build-essential

setup-nginx:
	@echo "Setting up Nginx configuration..."
	sudo tee $(NGINX_CONF) > /dev/null <<EOL
server {
    listen 80;
    server_name $(DOMAIN);

    location / {
        proxy_pass http://localhost:42069;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$$host;
        proxy_cache_bypass \$$http_upgrade;
    }
}
EOL
	sudo ln -sf $(NGINX_CONF) /etc/nginx/sites-enabled/
	sudo certbot --nginx -d $(DOMAIN) --non-interactive --agree-tos --email jpfraneto@gmail.com || true
	sudo systemctl restart nginx

setup-db:
	@echo "Setting up PostgreSQL database..."
	sudo -u postgres psql -c "CREATE USER $(DB_USER) WITH PASSWORD '$(DB_PASS)';" || true
	sudo -u postgres psql -c "CREATE DATABASE $(DB_NAME) OWNER $(DB_USER);" || true
	@echo "Creating .env file with database configuration..."
	@touch $(PROJECT_PATH)/.env
	@echo "DATABASE_URL=postgresql://$(DB_USER):$(DB_PASS)@localhost:5432/$(DB_NAME)" > $(PROJECT_PATH)/.env

setup-node:
	@echo "Setting up Node.js..."
	curl -fsSL https://deb.nodesource.com/setup_$(NODE_VERSION).x | sudo -E bash -
	sudo apt-get install -y nodejs
	sudo npm install -g pnpm

setup-project:
	@echo "Setting up project..."
	@if [ ! -d "$(PROJECT_PATH)" ]; then \
		git clone git@github.com:jpfraneto/ponder.veil.cash.git $(PROJECT_PATH) || \
		git clone https://github.com/jpfraneto/ponder.veil.cash.git $(PROJECT_PATH); \
	fi
	cd $(PROJECT_PATH) && pnpm install
	cd $(PROJECT_PATH) && cp .env.example .env || true
	@echo "Don't forget to update $(PROJECT_PATH)/.env with your RPC URL and other settings"
	cd $(PROJECT_PATH) && pnpm run build

setup-service:
	@echo "Setting up systemd service..."
	sudo tee /etc/systemd/system/veil-ponder.service > /dev/null <<EOL
[Unit]
Description=Veil Ponder Indexer
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=$(PROJECT_PATH)
Environment=NODE_ENV=production
ExecStart=/usr/bin/pnpm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOL
	sudo systemctl daemon-reload
	sudo systemctl enable veil-ponder
	sudo systemctl start veil-ponder

clean:
	@echo "Cleaning up..."
	sudo systemctl stop veil-ponder || true
	sudo systemctl disable veil-ponder || true
	sudo rm -f /etc/systemd/system/veil-ponder.service
	sudo systemctl daemon-reload
	sudo rm -f $(NGINX_CONF)
	sudo rm -f /etc/nginx/sites-enabled/ponder.guarpcast.com
	sudo -u postgres psql -c "DROP DATABASE IF EXISTS $(DB_NAME);" || true
	sudo -u postgres psql -c "DROP USER IF EXISTS $(DB_USER);" || true
	sudo rm -rf $(PROJECT_PATH)
	@echo "Cleanup completed"