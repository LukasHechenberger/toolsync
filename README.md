# devtools

> No more setting up the same 100 tools when starting a new project
>
> **Very opinionated** by default, but following **best practises** and easy to **customize**.

## Tools (TODO)

- [ ] prettier
  - [ ] Create .prettierrc (in all packages??)
  - [ ] Add `format` script (to all packages ??)
  - [ ] Add vscode extension if enabled
- [ ] ignore-sync
  - [ ] Install and setup "prepare" script
  - [ ] Create .prettierignore-sync if prettier is enabled
  - [ ] Add file associations to vscode settings
- [ ] Turborepo
  - [ ] Create turbo.json
  - [ ] Create root scripts
  - [ ] Create generators for new packages
    - [ ] These should also init other tools
- [ ] Eslint
  - [ ] Ensure all packages have an eslint config file
  - [ ] Add vscode extension if enabled
  - [ ] Framework integration:
    - Create e.g. nextjs config if used
    - Disable nextjs eslint during build if github actions is used
- [ ] Publint
  - [ ] Ensure all packages have a "check-build" script
  - [ ] Add "check-build" to turbo.json if necessary
  - [ ] Add vscode extension if enabled
- [ ] Readme
  - [ ] Generate readmes with package name, links etc. in prepare script
  - [ ] Generate mermaid dependency graph in root
- [ ] Generate VScode devcontainers
- [ ] Payload
  - [ ] Adjust eslint config for importmap etc.

All tools used/configured should be saved in a simple json file e.g.

```jsonc filename="devtools.json"
{
  "prettier": {
    "formatPackageJson": true // Enables `prettier-plugin-packagejson`
  }
}
```

Individial packages can disable tools in their package.json (or devtools.json ?)

```json filename="packages/my-package/package.json"
{
  "devtools": {
    "prettier": false
  }
}
```

## CLI

- `prepare` should set up tools, update readme etc. for each package
  - Run from repo root to handle all packages
  - Should not run during CI to speed up build
- `check` should call prepare and check if git status is clean - to validate setup during CI builds

> `check` could be a v2 feature
