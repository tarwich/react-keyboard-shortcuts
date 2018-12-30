import * as React from 'react';
import { Shortcut } from './shortcut';
import { ShortcutLayer } from './shortcut-layer';
interface IProps {
    debug?: boolean;
    shortcuts: {
        [chord: string]: () => void;
    } | Shortcut[];
}
export declare class HotkeyLayer extends React.Component<IProps> {
    shortcuts: {};
    layer: ShortcutLayer;
    componentDidMount(): void;
    componentDidUpdate(props: IProps): void;
    componentWillUnmount(): void;
    render(): null;
}
export {};
