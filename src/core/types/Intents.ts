import { VRangeDescription } from '../stores/VRange';
import { VNodeType } from '../stores/VNode';

// Specialized intents

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

// Change type
export interface FormatParagraphPayload {
    value: VNodeType;
}
export interface FormatParagraphIntent extends Intent {
    payload: FormatParagraphPayload;
}
