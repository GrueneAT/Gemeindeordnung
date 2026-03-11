IMAGE := gemeindeordnung-dev
PORT  := 5173

.PHONY: build dev preview generate test clean setup

build:
	docker build -f Dockerfile.claude -t $(IMAGE) .

dev: build
	docker run --rm -it \
		-p $(PORT):$(PORT) \
		-v $(PWD):/root/workspace \
		--entrypoint "" \
		$(IMAGE) \
		sh -c "npm install && npm run generate && npx vite --host 0.0.0.0 --port $(PORT)"

preview: build
	docker run --rm -it \
		-p 4173:4173 \
		-v $(PWD):/root/workspace \
		--entrypoint "" \
		$(IMAGE) \
		sh -c "npm install && npm run generate && npm run build && npx pagefind --site dist --force-language de && npx vite preview --host 0.0.0.0 --port 4173"

generate: build
	docker run --rm \
		-v $(PWD):/root/workspace \
		--entrypoint "" \
		$(IMAGE) \
		sh -c "npm install && npm run generate"

test: build
	docker run --rm \
		-v $(PWD):/root/workspace \
		--entrypoint "" \
		$(IMAGE) \
		sh -c "npm install && npm run test"

setup:
	npm install
	npm run fetch
	npm run parse
	npm run generate
	npm run build
	npx pagefind --site dist --force-language de

clean:
	docker rmi $(IMAGE) 2>/dev/null || true
