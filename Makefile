app:
	node_modules/.bin/electron-packager . pixe\(p\)late --arch x64 --platform darwin

linux: 
	node_modules/.bin/electron-packager . pixeplate --arch x64 --platform linux

deps:
	npm install

run:
	npx electron .
