# Odoo integration

To develop Jabberwock in Odoo, follow these steps:
1) Use the dev mode for the live reloading feature of Webpack. (optional)
2) Build the source and include it in Odoo.

## 1) Use the dev mode for the live reloading feature of Webpack.

Temporarily replace the library with the following script.
```bash
cp dev/odoo-integration-dev.js <your_odoo_path>/addons/web_editor/static/lib/jabberwock/jabberwock.js
```
`odoo-integration-dev.js` will load the script `build-full.js`.
The default loaded script is `http://localhost:8095/odoo-integration.js`.
You might want to change the port if your development port is not "8095".

Launch the development server (on port 8095):
```bash
npm run dev -- --port 8095
```

Once finished developing, rebuild the source and put it back in Odoo.

## 2) Build the source and include it in Odoo.

```bash
npm run build
npm run build-odoo
cp build/webpack/build/odoo-integration.js <your_odoo_path>/addons/web_editor/static/lib/jabberwock/jabberwock.js
```
