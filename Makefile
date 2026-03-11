IMAGE := gemeindeordnung-dev
PORT  := 4173

.PHONY: build review dev preview generate test clean setup

# Build the Docker image
build:
	docker build -f Dockerfile.claude -t $(IMAGE) .

# Local review in container — full build with search, served at http://localhost:4173/gemeindeordnung/
review: build
	docker run --rm -it \
		-p $(PORT):$(PORT) \
		-v $(PWD):/root/workspace \
		--entrypoint "" \
		$(IMAGE) \
		sh -c "npm install && npm run generate && npm run build && npx pagefind --site dist --force-language de && npx vite preview --host 0.0.0.0 --port $(PORT)"

# Dev server (no search) — hot reload at http://localhost:5173/gemeindeordnung/
dev: build
	docker run --rm -it \
		-p 5173:5173 \
		-v $(PWD):/root/workspace \
		--entrypoint "" \
		$(IMAGE) \
		sh -c "npm install && npm run generate && npx vite --host 0.0.0.0 --port 5173"

# Generate HTML pages from fetched data
generate: build
	docker run --rm \
		-v $(PWD):/root/workspace \
		--entrypoint "" \
		$(IMAGE) \
		sh -c "npm install && npm run generate"

# Run unit tests
test: build
	docker run --rm \
		-v $(PWD):/root/workspace \
		--entrypoint "" \
		$(IMAGE) \
		sh -c "npm install && npm run test"

# First-time setup (run outside container)
setup:
	npm install
	npm run fetch
	npm run parse
	npm run generate
	npm run build
	npx pagefind --site dist --force-language de

# Remove Docker image
clean:
	docker rmi $(IMAGE) 2>/dev/null || true
