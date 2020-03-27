import { nodeName } from '../../utils/src/utils';

interface CharMutation {
    old?: string;
    current?: string;
    target?: Node;
}
interface CharactersMapping {
    chars: string; // concatenated characters accross multiple nodes
    nodes: Array<Node>; // corresponding textual nodes
    offsets: number[]; // character offsets in their corresponding textual nodes
}

export class MutationNormalizer {
    /**
     * HTML element that represents the editable zone. Only events happening
     * inside the editable zone are subject to normalization.
     */
    editable: HTMLElement;
    /**
     * The MutationObserver used by the normalizer to watch the nodes that are
     * being modified since the normalizer creation until it is drestroyed.
     */
    _observer: MutationObserver;

    _listen: boolean;
    _mutations: MutationRecord[];

    constructor(editable: HTMLElement) {
        this._observer = new MutationObserver(this._onMutation.bind(this));
        this._observer.observe(editable, {
            characterDataOldValue: true, // add old text value on changes
            characterData: true, // monitor text content changes
            childList: true, // monitor child nodes addition or removal
            subtree: true, // extend monitoring to all children of the target
        });
    }
    start(): void {
        this._listen = true;
        this._mutations = [];
    }
    /**
     * Extract a mapping of the separate characters, their corresponding text
     * nodes and their offsets in said nodes from the given node's subtree.
     *
     * @private
     * @param charMutations
     * @returns { previous, current }
     */
    getCharactersMapping(): {
        insert: string;
        remove: string;
        index: number;
        previous: CharactersMapping;
        current: CharactersMapping;
    } {
        const before: Set<Node> = new Set();
        const add: Set<Node> = new Set();
        const current: Set<Node> = new Set();
        const textMutations = [];
        // Gather all modified nodes to notify the listener.
        function getSelfAndAllChildren(target: Node): Node[] {
            const texts = [target];
            target.childNodes.forEach(target => {
                texts.push(...getSelfAndAllChildren(target));
            });
            return texts;
        }
        function isTextNode(target: Node): boolean {
            return target.nodeType === Node.TEXT_NODE || nodeName(target) === 'BR';
        }
        this._mutations.forEach(record => {
            const targetMutation = record.target;
            const targetIsAdded = add.has(targetMutation);
            if (!targetIsAdded) {
                before.add(targetMutation);
            }
            if (record.type === 'characterData') {
                current.add(targetMutation);
                textMutations.push({
                    target: targetMutation,
                    old: record.oldValue.replace(/\u00A0/g, ' '),
                    current: targetMutation.textContent.replace(/\u00A0/g, ' '),
                });
            } else {
                record.addedNodes.forEach(node => {
                    getSelfAndAllChildren(node).forEach(child => {
                        if (!before.has(child)) {
                            add.add(child);
                        }
                        current.add(child);
                        if (!isTextNode(child)) {
                            return;
                        }
                        textMutations.push({
                            target: child,
                            old: '',
                            current:
                                child.nodeType === Node.TEXT_NODE
                                    ? child.textContent.replace(/\u00A0/g, ' ')
                                    : '\n',
                        });
                    });
                });
                record.removedNodes.forEach(node => {
                    getSelfAndAllChildren(node).forEach(child => {
                        if (current.has(child)) {
                            current.delete(child);
                        }
                        if (targetIsAdded) {
                            add.add(child);
                        }
                        if (!add.has(child)) {
                            before.add(child);
                        }
                        if (!isTextNode(child)) {
                            return;
                        }
                        textMutations.push({
                            target: child,
                            old:
                                child.nodeType === Node.TEXT_NODE
                                    ? child.textContent.replace(/\u00A0/g, ' ')
                                    : '\n',
                            current: '',
                        });
                    });
                });
            }
        });

        const already = new Map();
        const charMutations = [];
        textMutations.forEach(textMutation => {
            const target = textMutation.target;
            let mutation = already.get(target);
            if (mutation) {
                if (current.has(target) && !mutation.current.length) {
                    mutation.current = textMutation.current;
                }
                return;
            }
            if (current.has(target)) {
                mutation = {
                    target: target,
                    old: before.has(target) ? textMutation.old : '',
                    current: textMutation.current,
                };
                charMutations.push(mutation);
            } else if (before.has(target)) {
                mutation = {
                    target: target,
                    old: textMutation.old,
                    current: '',
                };
                charMutations.push(mutation);
            }
            already.set(target, mutation);
        });

        const currentLinked = this._getCharLinked(charMutations, 'current');
        const previousLinked = this._getCharLinked(charMutations, 'old');

        const oldText = previousLinked.chars;
        const currentText = currentLinked.chars;
        if (oldText === currentText) {
            return {
                index: -1,
                insert: '',
                remove: '',
                previous: previousLinked,
                current: currentLinked,
            };
        }

        const changePosition = this._changedOffset(oldText, currentText);
        const minLength = Math.min(oldText.length, currentText.length);

        let insertByChange: string;
        const unknownPosition = changePosition.left > minLength - changePosition.right;

        if (unknownPosition) {
            const maxLength = Math.max(oldText.length, currentText.length);
            const len = maxLength - minLength;
            insertByChange = currentText.slice(currentText.length - changePosition.right);
            for (let k = 0; k + len < minLength; k++) {
                if (insertByChange[k - 1] === ' ') {
                    insertByChange = insertByChange.slice(k);
                    break;
                }
            }
            insertByChange = insertByChange.slice(0, len);
            return {
                index: -1,
                insert: insertByChange,
                remove: '',
                previous: previousLinked,
                current: currentLinked,
            };
        } else {
            insertByChange = currentText.slice(
                changePosition.left,
                currentText.length - changePosition.right,
            );
        }

        let fineChangePosition: { left: number; right: number };
        let insertedWordAnalysed: string;
        if (textMutations.length > 1) {
            let alreadyFound = false;
            for (let k = textMutations.length - 1; k >= 0; k--) {
                const charMutation = textMutations[k];
                if (charMutation.old.length >= charMutation.current.length) {
                    continue;
                }
                let currentChange: string;
                if (charMutation.old !== '') {
                    if (alreadyFound) {
                        continue;
                    }
                    const oldTextMutation = charMutation.old;
                    const currentTextMutation = charMutation.current;
                    const resMutation = this._changedOffset(oldTextMutation, currentTextMutation);
                    currentChange = currentTextMutation.slice(
                        resMutation.left,
                        currentTextMutation.length - resMutation.right,
                    );
                } else if (charMutation.current === currentText) {
                    continue;
                } else {
                    currentChange = charMutation.current;
                }

                const changeIndex = currentChange.indexOf(insertByChange);
                if (changeIndex === -1) {
                    continue;
                }

                const indexStart = currentText.indexOf(currentChange);
                const indexEnd = indexStart + currentChange.length;
                const rangeChangeStart = changePosition.left - changeIndex;
                const rangeChangeEnd = currentText.length - changePosition.right;

                if (
                    (rangeChangeStart >= indexStart && rangeChangeStart < indexEnd) ||
                    (rangeChangeEnd > indexStart && rangeChangeEnd <= indexEnd) ||
                    (rangeChangeEnd >= indexEnd && rangeChangeStart <= indexStart)
                ) {
                    fineChangePosition = {
                        left: indexStart,
                        right: currentText.length - indexEnd,
                    };
                    insertedWordAnalysed = currentChange;
                    alreadyFound = true;
                    if (charMutation.old === '') {
                        break;
                    }
                }
            }
        }
        if (typeof insertedWordAnalysed === 'undefined') {
            insertedWordAnalysed = insertByChange;

            let beforeIndex = insertedWordAnalysed.indexOf(insertByChange);
            if (insertByChange === '') {
                beforeIndex = insertedWordAnalysed.length;
            } else {
                beforeIndex = 0;
            }
            fineChangePosition = {
                left: changePosition.left - beforeIndex,
                right: changePosition.right,
            };
        }

        const removedWordAnalysed = oldText.slice(
            fineChangePosition.left,
            oldText.length - fineChangePosition.right,
        );

        return {
            index: fineChangePosition.left,
            insert: insertedWordAnalysed,
            remove: removedWordAnalysed,
            previous: previousLinked,
            current: currentLinked,
        };
    }
    getMutatedElements(): Set<Node> {
        const elements: Set<Node> = new Set();
        this._mutations.forEach(MutationRecord => {
            if (MutationRecord.type === 'characterData') {
                elements.add(MutationRecord.target);
            } else {
                MutationRecord.addedNodes.forEach(target => elements.add(target));
                MutationRecord.removedNodes.forEach(target => elements.add(target));
            }
        });
        return elements;
    }
    stop(): void {
        this._listen = false;
    }
    /**
     * Called when destroy the mutation normalizer.
     * Remove all added handlers.
     *
     */
    destroy(): void {
        this._observer.disconnect();
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    _getCharLinked(charMutations: CharMutation[], type: string): CharactersMapping {
        const mapNodeValue = new WeakMap();
        const obj: CharactersMapping = {
            chars: '',
            nodes: [],
            offsets: [],
        };
        charMutations.forEach(charMutation => {
            mapNodeValue.set(charMutation.target, charMutation[type]);
            const len = charMutation[type].length;
            if (obj.nodes.length) {
                const charParented = new Set();
                let node = charMutation.target;
                while (node && node !== this.editable) {
                    charParented.add(node);
                    node = node.parentNode;
                }
                let first = obj.nodes[0];
                while (first && first !== this.editable) {
                    if (charParented.has(first.previousSibling)) {
                        obj.chars = charMutation[type] + obj.chars;
                        obj.nodes.unshift(...new Array(len).fill(charMutation.target));
                        obj.offsets.unshift(...Array(len).keys());
                        return;
                    }
                    first = first.parentNode;
                }
            }
            obj.chars += charMutation[type];
            obj.nodes.push(...new Array(len).fill(charMutation.target));
            obj.offsets.push(...Array(len).keys());
        });
        obj.chars = obj.chars.replace(/\u00A0/g, ' ');
        return obj;
    }
    _changedOffset(old: string, current: string): { left: number; right: number } {
        // In the optimal case where both the range is correctly placed and the
        // data property of the composition event is correctly set, the above
        // analysis is capable of finding the precise text that was inserted.
        // However, if any of these two conditions are not met, the results
        // might be spectacularly wrong. For example, spell checking suggestions
        // on MacOS are displayed while hovering the mispelled word, regardless
        // of the current position of the range, and the correction does not
        // trigger an update of the range position either after correcting.
        // Example (`|` represents the text cursor):
        //   Previous content: 'My friend Christofe was here.|'
        //   Current content:  'My friend Christophe Matthieu was here.|'
        //   Actual text inserted by the keyboard: 'Christophe Matthieu'
        //   Result if data is set to 'Christophe' (length: 10): 'e was here'
        //   Result if data is not set (regardless of the range): ''
        //
        // Because the first analysis might not be enough in some cases, a
        // second analysis must be performed. This analysis aims at precisely
        // identifying the offset of the actual change in the text by comparing
        // the previous content with the current one from left to right to find
        // the start of the change and from right to left to find its end.
        // Example (`|` represents the text cursor):
        //   Previous content: 'My friend Christofe| was here.'
        //   Current content:  'My friend Christophe Matthieu| was here.'
        //   Observed change:  'My friend Christo[fe => phe Matthieu] was here.'
        //   Change offsets in the current content: {left: 17, right: 29}

        const oldText = old;
        const currentText = current;
        const maxLength = Math.max(oldText.length, currentText.length);
        let left = 0;
        for (; left < maxLength; left++) {
            if (oldText[left] !== currentText[left]) {
                break;
            }
        }
        let right = 0;
        for (; right < maxLength; right++) {
            if (
                oldText[oldText.length - 1 - right] !== currentText[currentText.length - 1 - right]
            ) {
                break;
            }
        }
        return { left, right };
    }

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    _onMutation(mutationsList: MutationRecord[]): void {
        if (this._listen) {
            // we push the mutation because some browser (e.g. safari) separate mutations with
            // microtask.
            this._mutations.push(...mutationsList);
        }
    }
}
