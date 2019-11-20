import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import * as chokidar from 'chokidar';
import { exec } from 'child_process';

import * as markdownIt from 'markdown-it';

const md = markdownIt({
    html: false, // Enable HTML tags in source
    xhtmlOut: false, // Use '/' to close single tags (<br />).
    // This is only for full CommonMark compatibility.
    breaks: false, // Convert '\n' in paragraphs into <br>
    langPrefix: 'language-', // CSS language prefix for fenced blocks. Can be
    // useful for external highlighters.
    linkify: false, // Autoconvert URL-like text to links
    // Enable some language-neutral replacement + quotes beautification
    typographer: false,
    // Double + single quotes replacement pairs, when typographer enabled,
    // and smartquotes on. Could be either a String or an Array.
    //
    // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
    // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
    quotes: '“”‘’',
    // Highlighter function. Should return escaped HTML,
    // or '' if the source string is not changed and should be escaped externally.
    // If result starts with <pre... internal wrapper is skipped.
    highlight: function(/*str, lang*/) {
        return '';
    },
});

interface TreeItem {
    name: string;
    path?: string;
    children?: TreeItem[];
}

/**
 * Recursively traverse the directories starting from `rootDir` and build any markdown file found
 * into it's corresponding build path.
 *
 * @param rootDir The root directory of the documentation
 * @param buildPath The build path into which files are written
 * @param destPath
 */
function walkSync(rootDir: string, buildPath: string, destPath = ''): TreeItem[] {
    const currentDirPath = path.join(rootDir, destPath);
    const files = fs.readdirSync(currentDirPath);
    const items = [];
    files.forEach(function(fileName) {
        let item: TreeItem;
        const currentFilePath = path.join(currentDirPath, fileName);

        if (fs.statSync(currentFilePath).isDirectory()) {
            const newDestPath = path.join(destPath, fileName);
            const newBuildPath = path.join(buildPath, newDestPath);
            mkdirp.sync(newBuildPath);
            item = {
                name: fileName,
                path: newDestPath,
                children: walkSync(rootDir, buildPath, newDestPath),
            };
        } else {
            const isMarkdownReg = /\.md$/;
            if (fileName.match(isMarkdownReg)) {
                const articleName = fileName.replace(isMarkdownReg, '');
                const markdownFile = path.join(currentDirPath, fileName);
                const fileContent = md.render(fs.readFileSync(markdownFile, 'utf-8'));
                const newDestPath = path.join(destPath, articleName + '.html');
                const fileDestPath = path.join(buildPath, newDestPath);

                fs.writeFileSync(fileDestPath, fileContent);

                item = {
                    path: newDestPath,
                    name: articleName,
                };
            }
        }

        // only add items that are relevant. If a folder contain file that we do not
        // need (e. g. file that are not markdown), item will be undefined and therefore ignored.
        if (item) {
            items.push(item);
        }
    });
    return items;
}

const DOC_DIR = path.resolve(__dirname, '../../doc');
const BUILD_DIR = path.resolve(__dirname, '../../build/doc');

export function buildPages(): void {
    console.log('Build pages started.');
    mkdirp.sync(BUILD_DIR);
    fs.copyFileSync(
        path.resolve(__dirname, '../../doc/doc-index.html'),
        path.resolve(__dirname, '../../build/doc/doc-index.html'),
    );
    const tree = walkSync(DOC_DIR, BUILD_DIR, 'pages');
    fs.writeFileSync(
        path.resolve(__dirname, '../../build/doc/file-tree.json'),
        JSON.stringify(tree),
    );
    console.log('Build pages finished.');
}

const SRC_DIR = path.resolve(__dirname, '../../src');
const TYPEDOC_BIN_PATH = path.resolve(__dirname, '../../node_modules/typedoc/bin/typedoc');
const BUILD_API_DIR = path.resolve(BUILD_DIR, 'api');
const BUILD_API_TREE = path.resolve(BUILD_DIR, 'api.json');

interface Source {
    fileName: string;
    line: number;
    character: number;
}
interface NewSource {
    fileName: string;
    line: number;
    character: number;
    packageName?: string;
}
/**
 * Remove the foldername from the sources.
 *
 * jabberwock/src/core/...
 * becomes
 * src/core/...
 */
function changeSources(sources: Source[]): NewSource[] {
    return sources.map(source => {
        const newSource: NewSource = Object.assign({}, source);
        if (!source.fileName) {
            return newSource;
        } else {
            const splitedName = source.fileName.split('/');
            newSource.fileName = splitedName.slice(1).join('/');
            // todo: provide the proper package name, not the folder name
            newSource.packageName = splitedName.slice(0, 1)[0];
            return newSource;
        }
    });
}
/**
 * Transform a typedoc ojbect an transform into a tree.
 *
 * The tree look link this:
 * ```javascript
 * [
 *   '"tree/foo/bar1"': [object: Object],
 *   '"tree/foo/bar2"': [object: Object],
 * ]
 * ```
 *
 * To:
 * ```javascript
 * [{
 *       name: 'tree',
 *       children: [{
 *              name: 'foo',
 *              children: [
 *                  {
 *                      name: 'bar1',
 *                      ...object
 *                  },
 *                  {
 *                      name: 'bar2',
 *                      ...object
 *                  },
 *              ],
 *        }]
 * }]
 * ```
 */
function transformApiToTreeFiles(typeDocObject: any): any {
    // the final tree
    const tree = { children: [] };
    // all the childs that are in a file are saved
    const childs = {};
    const files = [];
    typeDocObject.children.forEach(child => {
        const newChild = { ...child };
        // the name look like '"fileName"', transform it to 'fileName' by removing the quotes.
        const currentPath = newChild.name.slice(1, -1);
        // complete the tree in the reduce
        const lastFile = currentPath.split('/').reduce((acc, item) => {
            let found = acc.children.find(x => x.name === item);

            if (!found) {
                found = { name: item, isFolder: true, children: [] };
                acc.children.push(found);
            }
            return found;
        }, tree);
        newChild.sources = changeSources([...newChild.sources]);

        lastFile.isFolder = false;
        lastFile.id = newChild.id;
        lastFile.sources = newChild.sources;

        if (newChild.children) {
            lastFile.children = newChild.children.map(fileChild => {
                const newFileChild = { ...fileChild };
                newFileChild.sources = changeSources([...newFileChild.sources]);
                if (newFileChild.children) {
                    newFileChild.children = newFileChild.children.map(c => {
                        c.sources = changeSources([...c.sources]);
                        return c;
                    });
                }

                // add the file in `childs` dictionnary for later.
                childs[newFileChild.id] = newFileChild;

                // only return the following key for the root object
                return {
                    name: newFileChild.name,
                    id: newFileChild.id,
                    kind: newFileChild.kind,
                };
            });
        }

        files[newChild.id] = newChild;
    });

    files.forEach(file => {
        fs.writeFileSync(path.join(BUILD_API_DIR, `${file.id}.json`), JSON.stringify(file));
    });

    Object.keys(childs).forEach(childId => {
        // save the structure in the build dir
        fs.writeFileSync(
            path.join(BUILD_API_DIR, `${childId}.json`),
            JSON.stringify(childs[childId]),
        );
    });
    return tree.children;
}

export function buildAPI(): void {
    const command = `${TYPEDOC_BIN_PATH} --json ${BUILD_API_TREE} ${SRC_DIR}`;
    console.log('Build API with the command:\n', command);
    mkdirp(BUILD_API_DIR);
    exec(command, (err, stderr) => {
        if (err) throw err;
        if (stderr) throw stderr;
        const fileJson = JSON.parse(fs.readFileSync(BUILD_API_TREE, 'utf-8'));
        const newfileJson = transformApiToTreeFiles(fileJson);
        // the first index of newFileJson[0] (jabberwock) is 'src'
        // the following line flatten the newfileJson[0] (jabberwock) by removing the 'src' key
        newfileJson[0].children = newfileJson[0].children[0].children;
        // the first index of newFileJson[1] (owl) is 'src'
        // the following line flatten the newfileJson[1] (owl) by removing the 'src' key
        newfileJson[1].children = newfileJson[1].children[0].children;
        fs.writeFileSync(
            BUILD_API_TREE,
            JSON.stringify({
                packages: {
                    jabberwock: {
                        // todo: make the github link configurable
                        githubLink: 'https://github.com/odoo-dev/jabberwock/blob/master/',
                    },
                    // todo: remove owl
                    owl: {
                        githubLink: 'https://github.com/odoo/owl/blob/master/',
                    },
                },
                tree: newfileJson,
            }),
        );
    });
    console.log('Build API finished.');
}

export function watchPages(): void {
    chokidar.watch(DOC_DIR, { ignoreInitial: true }).on('all', () => {
        buildPages();
    });
}

export function watchAPI(): void {
    chokidar.watch(SRC_DIR, { ignoreInitial: true }).on('all', (...args) => {
        buildAPI();
    });
}
