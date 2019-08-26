interface Config {
    theme: string,
};

export default function JWEditor(el = document.body) {
    const pluginsRegistry: object[] = [];
    return {
        start: (): void => {
            el.setAttribute('contenteditable', 'true');
        },
        addPlugin: (plugin: object): void => {
            pluginsRegistry.push(plugin);
        },
        addPlugins: (plugins: object[]): void => {
            plugins.forEach(plugin => pluginsRegistry.push(plugin));
        },
        loadConfig: (config: Config): void => {
            console.log(config.theme);
        },
    };
}
