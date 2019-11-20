import { Store } from 'owl-framework/src/index';
const actions = {
    loadTree({ state }, tree): void {
        state.tree = tree;
    },
};

const state = {
    tree: {},
};

export const store = new Store({ state, actions });
