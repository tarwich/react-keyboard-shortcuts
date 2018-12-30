/** @jsx createElement */
import { createElement, Component, Fragment, MouseEvent } from 'react';
import { observer } from 'mobx-react';
import './keyboard-shortcuts.scss';
import { HotkeyStore } from './hotkey-store';
import { Shortcut } from './shortcut';
import { MODIFIERS } from './normalizeKey';
import { toJS } from 'mobx';

@observer
export class HotkeyDebugger extends Component {
  handleClickHeader = (event: MouseEvent) => {
    if (event.altKey) console.log(toJS(HotkeyStore));
  };

  render() {
    return (
      <span className="ShortcutManager ShortcutManager--debug">
        <div
          className="ShortcutManager__Header"
          onClick={this.handleClickHeader}
        >
          Keyboard Shortcuts
          <div className="ShortcutManager__Modifiers">
            {Object.entries(HotkeyStore.modifiers).map(
              ([modifier, pressed]: [
                keyof typeof HotkeyStore['modifiers'],
                boolean
              ]) => (
                <span
                  className={`ShortcutManager__Modifier ${
                    pressed ? 'ShortcutManager__Modifier--pressed' : ''
                  }`}
                  key={modifier}
                >
                  {MODIFIERS[modifier]}
                </span>
              )
            )}
          </div>
        </div>
        <div className="ShortcutManager__Panel">
          <div className="ShortcutManager__History">
            History:
            <div className="ShortcutManager__HistoryKeys">
              {HotkeyStore.history.map(key => (
                <code key={key.time}>{key.key}</code>
              ))}
            </div>
          </div>
          {HotkeyStore.layers
            .slice()
            .reverse()
            .map((layer, i) => (
              <dl className="ShortcutManager__Layer" key={i}>
                <header>
                  {`Layer ${String(HotkeyStore.layers.length - i).padStart(
                    2,
                    '0'
                  )}`}
                </header>
                {layer.shortcuts.map(shortcut => this.renderShortcut(shortcut))}
              </dl>
            ))}
        </div>
      </span>
    );
  }

  renderChord(chord: string) {
    const { history } = HotkeyStore;

    for (let i = history.length; i >= 0; --i) {
      const historySlice = history.slice(-i).join(' ');
      const historySliceLength = historySlice.length;

      if (chord.startsWith(historySlice)) {
        return (
          <Fragment>
            <span className="match">{chord.substr(0, historySliceLength)}</span>
            {chord.substr(historySliceLength)}
          </Fragment>
        );
      }
    }

    return chord;
  }

  renderShortcut(shortcut: Shortcut) {
    const triggeredClass =
      HotkeyStore.match &&
      HotkeyStore.match.chord === shortcut.chord &&
      HotkeyStore.match.caption === shortcut.caption
        ? 'Shortcut--triggered'
        : '';

    const overriddenClass =
      HotkeyStore.shortcuts.find(other => other.chord === shortcut.chord) !==
      shortcut
        ? 'Shortcut--overridden'
        : '';

    return (
      <span
        className={`Shortcut ${triggeredClass} ${overriddenClass}`}
        key={shortcut.id}
      >
        <dt className="Shortcut__Chord">
          {this.renderChord(shortcut.chord.replace(' ', ''))}
        </dt>
        <dd className="Shortcut__Definition">{shortcut.caption}</dd>
      </span>
    );
  }
}
