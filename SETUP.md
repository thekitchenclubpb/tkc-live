# Kitchen Club live scoring: setup (about 10 minutes)

What you get
- Scoring link:  https://YOUR-SITE.netlify.app/        (tablet/TV only, needs the secret key once)
- Watch-only link: https://YOUR-SITE.netlify.app/live  (phones; cannot change scores or the timer)

1. Put these files in a new GitHub repository (upload the folder contents: public/, netlify/, netlify.toml, package.json).
2. Netlify > Add new site > Import an existing project > pick the repo. Leave build settings as they are (netlify.toml sets them).
3. Site configuration > Environment variables > add  TKC_WRITE_KEY  = a secret word you choose (e.g. kcpickle-7421). Then Deploys > Trigger deploy.
4. On the tablet, open  https://YOUR-SITE.netlify.app/?key=YOUR-SECRET  once. The bottom-left pill should read "LIVE VIEW SYNCED".
5. On your phone, open  https://YOUR-SITE.netlify.app/live
6. Optional: Forms > re-enable form detection and the email notification on the new site if you want the auto result emails there.

Rules
- Only the tablet/TV should have the key. A second device with the key is stopped automatically so it can't overwrite scores.
- After test rounds, press "Reset Entire Session" on the tablet: it clears the live view too.
- If the Netlify/internet connection drops, scoring carries on normally and catches up when it returns.
