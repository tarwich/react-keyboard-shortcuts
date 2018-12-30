import { ShortcutDefinition } from './shortcut-definition';
import { Shortcut } from './shortcut';
export declare class ShortcutLayer {
    id: number;
    shortcuts: Shortcut[];
    constructor(shortcuts: Shortcut[] | ShortcutDefinition);
}
