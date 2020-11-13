```
yarn add ../..
firebase emulators:export ../firestore/seed
npm version patch
npm publish

yarn add -D typescript-json-schema
npx typescript-json-schema
npx typescript-json-schema src/generator/type.ts FlamestoreSchema
```