import { KeyHistory } from './key-history';
import { ShortcutLayer } from './shortcut-layer';
import { Shortcut } from './shortcut';
declare class Store {
    debugHistory: string[];
    history: KeyHistory[];
    layers: ShortcutLayer[];
    match: Shortcut | null;
    readonly shortcuts: Shortcut[];
    modifiers: {
        ctrlKey: boolean;
        altKey: boolean;
        shiftKey: boolean;
        metaKey: boolean;
    };
}
export declare const HotkeyStore: Store;
export {};
