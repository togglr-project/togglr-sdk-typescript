.PHONY: help install build clean test lint format generate-client dev examples

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	npm install

build: ## Build the project
	npm run build

clean: ## Clean build artifacts
	npm run clean

test: ## Run tests
	npm test

lint: ## Run linter
	npm run lint

lint-fix: ## Fix linting issues
	npm run lint:fix

format: ## Format code
	npm run format

generate-client: ## Generate OpenAPI client
	npm run generate-client

dev: ## Start development mode
	npm run dev

examples: ## Run examples
	@echo "Running simple example..."
	npx ts-node examples/simple-example.ts
	@echo ""
	@echo "Running advanced example..."
	npx ts-node examples/advanced-example.ts

all: clean install generate-client build test lint ## Run all checks

publish: clean install generate-client build test lint ## Prepare for publishing
	@echo "Ready for publishing!"
