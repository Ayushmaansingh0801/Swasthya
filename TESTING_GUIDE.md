# TESTING_GUIDE.md

## Backend
```
npm test                 # vitest run (42 tests)
npm run test:watch       # vitest
```

## Build
```
npm run build            # server tsc + client vite build
```

## Type check
```
cd server && npx tsc --noEmit
```

## Manual smoke tests
See README §7.

## Blockers
- MongoMemoryServer may fassert in some environments; use persistent MongoDB.
- External integrations require credentials/hardware.
