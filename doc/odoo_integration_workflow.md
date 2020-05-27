# Odoo integration

To develop Jabberwock in Odoo, follow these steps:
1) Use the dev mode for the live reloading feature of Webpack. (optional)
2) Build the source and include it in Odoo.

## 1) Use the dev mode for the live reloading feature of Webpack.

Temporarily replace the library with the following script.
```bash
cp dev/odoo-integration.js <your_odoo_path>/addons/web_editor/static/lib/jabberwock/jabberwock.js
```
`odoo-integration.js` will load the script `build-full.js`.
The default loaded script is `http://localhost:8080/build-full.js`.
You might want to change the port if your development port is not "8080".

Launch the development server (on port 8080 by default):
```bash
npm run dev
```

Once finished developing, rebuild the source and put it back in Odoo.

## 2) Build the source and include it in Odoo.

```bash
npm run build
npm run build-odoo
cp build/webpack/build/build-full-odoo.js <your_odoo_path>/addons/web_editor/static/lib/jabberwock/jabberwock.js
```
