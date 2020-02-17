import template from './jabberwocky.xml';

export const jabberwocky = {
    init: function(container: HTMLElement): HTMLElement {
        container.innerHTML = template;
        return container;
    },
};
