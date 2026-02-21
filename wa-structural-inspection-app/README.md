# WA Structural House Inspection App (Expo)

React Native / Expo iOS-focused app template for Western Australia structural engineers.

## Included capabilities
- Client + inspection detail form
- 8-item structural checklist (foundations, framing, walls, roof, concrete, balconies/decks, drainage, movement)
- Per-item photo capture via camera
- Per-item defect notes + status rating
- Local offline draft persistence using AsyncStorage
- Generated text report ready for copy/paste into formal documentation
- AS 4349.1-style scope notes for pre-purchase style visual reporting context

## Run locally
```bash
cd wa-structural-inspection-app
npm install
npm run ios
```

## Production hardening suggestions
- Add authentication (if syncing to cloud)
- Add encrypted local database storage for sensitive projects
- Add report export (PDF/email) workflow and signed engineer declaration
- Add audit trail and timestamped media metadata
