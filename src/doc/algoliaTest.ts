// const algoliasearch = require('algoliasearch');
// const algoliasearch = require('algoliasearch/reactnative');
// const algoliasearch = require('algoliasearch/lite');
// import * as algoliasearch from 'algoliasearch'; // When using TypeScript

// or just use algoliasearch if you are using a <script> tag
// if you are using AMD module loader, algoliasearch will not be defined in window,
// but in the AMD modules of the page

import * as algoliasearch from 'algoliasearch';

const objects = [{ name: 'foo' }, { name: 'bar' }];
const client = algoliasearch('EVAWRA731F', '9e01eab28058d026fda0392e22851bb9');
const index = client.initIndex('tests');

index.setSettings(
    {
        'customRanking': ['desc(followers)'],
    },
    (err, content) => {
        console.log(content);
    },
);

async function boot(): Promise<void> {
    await index.clearIndex();

    index.addObjects(objects, (err, content) => {
        if (err) {
            console.error(err);
        } else {
            console.log('done', content);
        }
    });
}
boot();
