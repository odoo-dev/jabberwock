import {Action} from '../actions/Actions';

export default function Dispatcher<TPayload>() {
    return {
        dispatch: (action: Action): void => {},
        isDispatching: (): boolean => {
            return false;
        },
        register: (callback: (payload: TPayload) => void): string => {
            return '';
        },
        unregister: (id: string): void => {},
        waitFor: (ids: string[]): void => {},
    }
}
