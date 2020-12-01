```
yarn add ../..
firebase emulators:export ../firestore/seed
npm version patch
npm publish

yarn add -D ts-json-schema-generator
./node_modules/.bin/ts-json-schema-generator --path src/generator/type.ts --type FlamestoreSchema --out flamestore-schema/v2.json
```