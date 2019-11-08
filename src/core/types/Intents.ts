import { VRangeDescription } from '../stores/VRange';

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
