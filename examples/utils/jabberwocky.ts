import template from './jabberwocky.xml';

export const jabberwocky = {
    init: function(): HTMLElement {
        const container = document.createElement('div');
        document.body.appendChild(container);
        container.style.display = 'none';
        container.style.textAlign = 'center';
        container.innerHTML = template;
        return container;
    },
};
