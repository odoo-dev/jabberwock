import { BasicHtmlRenderingEngine, RenderingEngine } from '../utils/BasicHtmlRenderingEngine';

export enum VNodeType {
    ROOT = 'ROOT',
    PARAGRAPH = 'PARAGRAPH',
    HEADING1 = 'HEADING1',
    HEADING2 = 'HEADING2',
    HEADING3 = 'HEADING3',
    HEADING4 = 'HEADING4',
    HEADING5 = 'HEADING5',
    HEADING6 = 'HEADING6',
    CHAR = 'CHAR',
    LINE_BREAK = 'LINE_BREAK',
}

export interface FormatType {
    bold?: boolean;
    italic?: boolean;
    underlined?: boolean;
}

let id = 0;

export class VNode {
    readonly type: VNodeType;
    children: VNode[] = [];
    format: FormatType;
    readonly id = id;
    index = 0;
    parent: VNode | null = null;
    renderingEngines: Record<string, RenderingEngine> = {
        html: BasicHtmlRenderingEngine,
    };
    originalTag: string;
    value: string | undefined;

    constructor(type: VNodeType, originalTag = '', value?: string, format?: FormatType) {
        this.type = type;
        this.originalTag = originalTag;
        this.value = value;
        this.format = format || {
            bold: false,
            italic: false,
            underlined: false,
        };
        id++;
    }

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

    /**
     * Render the VNode to the given format.
     *
     * @param to the name of the format to which we want to render (default: html)
     */
    render<T>(to = 'html'): T {
        return this.renderingEngines[to].render(this) as T;
    }

    //--------------------------------------------------------------------------
    // Getters
    //--------------------------------------------------------------------------

    get firstChild(): VNode | undefined {
        return this.nthChild(0);
    }
    get lastChild(): VNode | undefined {
        return this.nthChild(this.children.length - 1);
    }
    get length(): number {
        return this.value ? this.value.length : this.children.length;
    }
    get nextSibling(): VNode | undefined {
        return this.parent && this.parent.nthChild(this.index + 1);
    }
    nthChild(index: number): VNode | undefined {
        return (index >= 0 && this.children[index]) || undefined;
    }
    get previousSibling(): VNode | undefined {
        return this.parent && this.parent.nthChild(this.index - 1);
    }
    totalLength(current = 0): number {
        current += this.length;
        this.children.forEach((child: VNode): void => {
            if (child.children.length) {
                current = child.totalLength(current);
            }
        });
        return current;
    }
    get siblings(): VNode[] {
        return (this.parent && this.parent.children) || [];
    }
    text(current = ''): string {
        if (this.value) {
            current += this.value;
        }
        this.children.forEach((child: VNode): void => {
            current = child.text(current);
        });
        return current;
    }

    //--------------------------------------------------------------------------
    // Public methods
    //--------------------------------------------------------------------------

    /**
     * Append a child to this node. Return self.
     */
    append(child: VNode): VNode {
        const index = this.children.length > 0 ? this.children.length : 0;
        child.setPosition(this, index);
        return this;
    }
    hasFormat(): boolean {
        return Object.keys(this.format).some(
            (key: keyof FormatType): boolean => !!this.format[key],
        );
    }
    /**
     * Prepend a child to this node. Return self.
     */
    prepend(child: VNode): VNode {
        child.setPosition(this, 0);
        return this;
    }
    /**
     * Remove the nth child from this node. Return self.
     */
    removeChild(index: number): VNode {
        delete this.children[index];
        this.children.splice(index);
        return this;
    }
    /**
     * Set the position of this node in the document: update references to other
     * nodes in this node, and to this node in other nodes.
     */
    setPosition(parent: VNode, index: number, children?: VNode[]): VNode {
        if (this.parent) {
            // remove this from old parent
            this.parent.children.splice(this.index);
        }
        this.parent = parent;
        this.parent.children.splice(index, 0, this);
        this.index = index;
        this.children = children || this.children;
        return this;
    }
}
