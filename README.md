# ![jabberwock](https://upload.wikimedia.org/wikipedia/commons/8/8a/Jabberwock_insignia.png) Jabberwock

## Get started
### Install
Install the dev dependencies
```bash
npm install
```

### dev
```bash
npm run dev
```
See the "dev" script in [package.json](./package.json)

### build
```bash
npm run build
```
See [package.json](./package.json)
See the "run" script in [package.json](./package.json)

### use dev tools
1. Get permissions to access odoo/owl
2. In the root folder:
```bash
git clone git@github.com:odoo/owl.git lib/owl
```
3. In `lib/owl/package.json`, in `scripts`, add:
```json
"buildesm": "npm run build:js && npm run build:bundle -- -f esm --outro ''",
```
4. In `lib/owl`:
```bash
npm install
npm run buildesm
```
5. In the root folder:
```bash
npm install
npm run dev-esm
```

## Vision
- Code quality
  - Document everything
  - Share the experience of building the editor
- Easy to instantiate
  - No configuration
- Modularity
- Easy and powerful plugin development
- Paradigm-agnostic plugin development (functional, object oriented)
- Feels pleasant to use

## Futur(ist) features
- Collaborative
  - Flexible range
- Multimode
- UI Themes
- Tree history
- Global history (odoo)
- Command Bar
- Latex mode
  - Flexible rules
- Music notation edition
- Template edition
  - Mirror
  - Input-agnostic (any templating engine could be implemented)
  - Output-agnostic (any templating could be output)
- Dynamic values
- Odoo Studio
- Votes
- Single Page Application
- Playground
- Free canvas
- Zoom
- Visual configurator
- Word count
- Syntax highlighting
- Change the documentation with direct modification
- Flowcharts and other graphs

## Name suggestions
- Jabberwock
- Vorpal Editor
- Kring
- °° Jubjub
- ° Octavo / In-Octavo
- ° Limerick
- ° Ode (ODoo Editor)
- ° Asgard
- ° Odin
- ° Mjolnir
- Fenrir

° = name exists on npm
°° = name exists outside of npm
