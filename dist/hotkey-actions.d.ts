import { ShortcutDefinition } from './shortcut-definition';
import { Shortcut } from './shortcut';
import { ShortcutLayer } from './shortcut-layer';
export declare class HotkeyActions {
    static addLayer(shortcuts: ShortcutDefinition | Shortcut[]): ShortcutLayer;
    static handleKeyDown: (event: KeyboardEvent) => void;
    static handleKeyUp: () => void;
    static installEventListeners(): void;
    static removeLayer(layerToRemove: ShortcutLayer): void;
    static updateLayer(layerToReplace: ShortcutLayer, shortcuts: ShortcutDefinition | Shortcut[]): ShortcutLayer;
}
