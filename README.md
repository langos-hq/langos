# Lang OS

Lang OS is a platform for managing localisation of application content.

Lang OS has three main components:
1. A Remix web app to manage content and for translators to translate/localise content.
2. A Laravel backend for storing and serving all the content.
3. A CLI for processing your user interfaces to become localisable, and importing and exporting your content from your code base to Lang OS and back.

## State of the Repo

This repo is a monorepo, meaning the entire Lang OS project lives in a single repository. Apps including the web app, backend, and CLI are found in the `apps` directory.

The current state of the project is:
- Web app
  - Porting and rewriting from a Blitz JS app to a Remix app. Very early.
- Laravel backend
  - Extracting backend logic from the Blitz app to a Laravel app. Very early.
- CLI
  - Rewriting using `pastel`. There is a proof of concept of wrapping a React app. I will be porting the import and export code from the old CLI.

## Licensing

Lang OS is an open core project. You may use this code and deploy it for personal or internal business use but you may not repackage or resell it in any way.
