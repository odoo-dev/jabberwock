import * as owl from 'owl-framework';
import { Env } from 'owl-framework/src/component/component';
import searchSrc from './../assets/img/search.png';
// import instantsearch from 'instantsearch.js';
// import { searchBox, hits, infiniteHits } from 'instantsearch.js/es/widgets';
// import * as algoliasearch from 'algoliasearch';

// // 1. Instantiate the search
// const search = instantsearch({
//     indexName: 'tests',
//     searchClient: algoliasearch('EVAWRA731F', '6f036a752e8429c9a333419df2b2872e'),
// });

export class Search extends owl.Component<Env, {}> {
    asset = {
        searchSrc,
    };

    mounted(): void {
        // console.log('mounted this:', this);
        // setTimeout(() => {
        //     search.addWidgets([
        //         // 2. Create an interactive search box
        //         searchBox({
        //             container: document.querySelector('.seach__input-box'),
        //             placeholder: 'Search for products',
        //         }),
        //         // 3. Plug the search results into the product container
        //         infiniteHits({
        //             container: document.querySelector('.seach__input-result'),
        //             // templates: {
        //             //     item: '{{#helpers.highlight}}{ "attribute": "name" }{{/helpers.highlight}}',
        //             // },
        //         }),
        //         // // 4. Make the brands refinable
        //         // instantsearch.widgets.refinementList({
        //         //     container: '#brand',
        //         //     attribute: 'brand',
        //         // }),
        //     ]);
        //     // 5. Start the search!
        //     search.start();
        // }, 1000);
    }
}
