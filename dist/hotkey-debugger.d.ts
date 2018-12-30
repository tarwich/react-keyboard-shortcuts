import * as React from 'react';
import './keyboard-shortcuts.scss';
import { Shortcut } from './shortcut';
export declare class HotkeyDebugger extends React.Component {
    handleClickHeader: (event: React.MouseEvent<Element>) => void;
    render(): JSX.Element;
    renderChord(chord: string): string | JSX.Element;
    renderShortcut(shortcut: Shortcut): JSX.Element;
}
