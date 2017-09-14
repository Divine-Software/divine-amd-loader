

all:	amd-loader.min.js

clean:
	$(RM) -r node_modules amd-loader.min.js

amd-loader.min.js:	amd-loader.js Makefile node_modules/.timestamp
	node_modules/.bin/uglifyjs --compress --mangle < $< -o $@

node_modules/.timestamp: package.json
	yarn && touch $@
