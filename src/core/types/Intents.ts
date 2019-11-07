import { VRangeDescription } from '../stores/VRange';
import { VNodeType } from '../stores/VNode';

// Specialized intents

// Generic keydown
export interface KeydownPayload extends ActionPayload {
    altKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
    elements: Set<HTMLElement>;
    origin: string;
}
export interface KeydownIntent extends Intent {
    payload: KeydownPayload;
}

// Change type
export interface FormatParagraphPayload extends KeydownPayload {
    value: VNodeType;
}
export interface FormatParagraphIntent extends Intent {
    payload: FormatParagraphPayload;
}

// Insert
export interface InsertPayload extends ActionPayload {
    value: string;
}
export interface InsertIntent extends Intent {
    payload: InsertPayload;
}

// Range
export interface RangePayload extends ActionPayload {
    vRange: VRangeDescription;
}
export interface RangeIntent extends Intent {
    payload: RangePayload;
}

export interface FormatPayload extends ActionPayload {
    format: 'bold' | 'italic' | 'underline';
}
export interface FormatIntent extends Intent {
    payload: FormatPayload;
}
