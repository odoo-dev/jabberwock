// Type definitions for non-npm package UI Events W3C Working Draft — Input Events — Interface InputEvent 1.0
// Project: https://w3c.github.io/uievents/#interface-inputevent
// Definitions by: Steven Sinatra <https://github.com/diagramatics>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

interface InputEventInit extends UIEventInit {
    data?: string;
    dataTransfer?: DataTransfer;
    inputType?: string;
    isComposing?: boolean;
}

// As of August 29th 2019, InputEvent is considered experimental by MDN as some
// of its properties are said to be unsupported by Edge and Safari. This is
// probably the reason why its type definition is not included in the basic
// TypeScript distribution. However, these properties actually appear to be
// working perfectly fine on these browser after some manual testing on MacOS.
interface InputEvent extends UIEvent {
    readonly data: string;
    readonly dataTransfer: DataTransfer;
    readonly inputType: string;
    readonly isComposing: boolean;
}
declare let InputEvent: {
    prototype: InputEvent;
    new (type: string, eventInitDict?: InputEventInit): InputEvent;
};
