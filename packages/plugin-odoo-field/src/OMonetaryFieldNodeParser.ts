// import { OdooFieldDomParser } from '../../OdooFieldDomParser';
// import { DomParsingEngine } from '../../../../plugin-dom/src/DomParsingEngine';
// import { OdooFieldNode } from '../../OdooFieldNode';
// import { VElement } from '../../../../core/src/VNodes/VElement';

// export class OdooMonetaryFieldDomParser extends OdooFieldDomParser {
//     static id = 'dom';
//     engine: DomParsingEngine;
//     predicate = (item: Node): boolean => {
//         return (
//             item instanceof Element &&
//             item.attributes['data-oe-type'] &&
//             item.attributes['data-oe-model'] &&
//             item.attributes['data-oe-type'].value === 'monetary'
//         );
//     };

//     constructor(engine) {
//         super(engine);
//         // ? dmo: We need to discuss about a way to send signals to the dom in a
//         // better way because the following code create a dependecy to the dom.
//         // I'm not sure we want to code this dependecy that way.
//         const domPlugin = this.engine.editor.plugins.get(Dom);
//         domPlugin.beforeRenderInEditable.push(this._beforeRenderInEditable.bind(this));
//     }

//     async parse(element: HTMLElement): Promise<OdooFieldNode[]> {
//         return [new VElement('div')];
//     }
// }
