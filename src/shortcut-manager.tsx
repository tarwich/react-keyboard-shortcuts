/** @jsx createElement */
import { observable } from 'mobx';
import { createElement, Component, Fragment } from 'react';
import { observer } from 'mobx-react';
import { render, unmountComponentAtNode } from 'react-dom';
import './keyboard-shortcuts.scss';

type ShortcutDefinition = { [chord: string]: () => void };

/** How long should keys be left in the history */
const HISTORY_TIMEOUT = 1500;

export type Shortcut = {
  chord: string;
  action: Function;
  caption?: string;
};

const MODIFIERS = {
  altKey: '!',
  metaKey: '#',
  ctrlKey: '^',
  shiftKey: '+',
};

function normalizeKey(key: string) {
  return [...key.toLowerCase()].sort().join('');
}

const ShortcutManagerState = observable({
  layers: [] as Shortcut[][],
  history: [] as string[],
  debugHistory: [] as string[],
});

export class ShortcutManager {
  // #region Fields
  shortcuts: Shortcut[];

  private _debug = false;
  /** The container in which the debug UI will be rendered */
  private container: Element;
  /** Timers to clear the history */
  timers: number[] = [];
  get debug() {
    return this._debug;
  }
  set debug(value: boolean) {
    this._debug = value;

    if (value) this.installDebugUi();
    else this.removeDebugUi();
  }
  // #endregion

  constructor(options: { debug?: boolean } = {}) {
    document.body.addEventListener('keydown', this.handleKeyDown);
    this.debug = options.debug || false;
    this.debug = true;
  }

  // #region Methods
  addLayer(shortcuts: ShortcutDefinition | Shortcut[]) {
    const layer = Array.isArray(shortcuts)
      ? shortcuts
      : this.convertDefinitionToLayer(shortcuts);
    ShortcutManagerState.layers.push(layer);
    this.updateAllShortcuts();
    return layer;
  }

  private convertDefinitionToLayer(shortcuts: ShortcutDefinition): Shortcut[] {
    return Object.entries(shortcuts).map(([chord, action]) => {
      return {
        // Sort the chords to normalize the modifiers
        chord: chord
          .split(' ')
          .map(normalizeKey)
          .join(' '),
        action,
      };
    });
  }

  handleKeyDown = (event: KeyboardEvent) => {
    // Ignore modifier keys
    if (event.location !== 0) return;
    // Normalize the key
    const key = normalizeKey(
      Object.entries(MODIFIERS)
        .map(
          ([modifier, symbol]: [keyof typeof MODIFIERS, string]) =>
            event[modifier] ? symbol : ''
        )
        .join('') + event.key.toLowerCase()
    );
    // Rotate this key into the history
    ShortcutManagerState.history = ShortcutManagerState.history
      .slice()
      .concat(key);
    ShortcutManagerState.debugHistory = ShortcutManagerState.debugHistory
      .slice()
      .concat(key);
    // Create a timer to kill the character from the history
    this.timers.push(
      window.setTimeout(() => {
        ShortcutManagerState.history = ShortcutManagerState.history.slice(1);
        ShortcutManagerState.debugHistory = ShortcutManagerState.debugHistory.slice(
          1
        );
      }, HISTORY_TIMEOUT)
    );
    const textHistory = ShortcutManagerState.history.slice().join(' ');
    // Check the shortcuts
    const match = this.shortcuts
      .slice()
      .reverse()
      .find(
        shortcut =>
          shortcut.action &&
          shortcut.chord === textHistory.slice(-shortcut.chord.length)
      );
    if (match) match.action();
  };

  private installDebugUi() {
    // Create the container if it doesn't exist
    this.container =
      document.querySelector('.ShortcutManagerContainer') ||
      document.body.appendChild(document.createElement('div'));
    this.container.classList.add('ShortcutManagerContainer');
    // Render the shortcut manager in the container
    render(<ShortcutManagerUi />, this.container);
  }

  private removeDebugUi() {
    if (this.container) unmountComponentAtNode(this.container);
  }

  removeLayer(layerToRemove: Shortcut[]) {
    ShortcutManagerState.layers = ShortcutManagerState.layers.filter(
      layer => layer === layerToRemove
    );
    this.updateAllShortcuts();
  }

  updateAllShortcuts() {
    this.shortcuts = ShortcutManagerState.layers.flatMap(layer => layer);
  }

  updateLayer(
    layerToReplace: Shortcut[],
    shortcuts: ShortcutDefinition | Shortcut[]
  ) {
    const newLayer = Array.isArray(shortcuts)
      ? shortcuts
      : this.convertDefinitionToLayer(shortcuts);
    ShortcutManagerState.layers = ShortcutManagerState.layers.map(
      layer => (layer === layerToReplace ? newLayer : layer)
    );
    return newLayer;
  }
  // #endregion
}

@observer
class ShortcutManagerUi extends Component {
  render() {
    return (
      <span className="ShortcutManager ShortcutManager--debug">
        <div className="ShortcutManager__Header">
          Keyboard Shortcuts
          <svg
            width="21"
            height="12"
            viewBox="0 0 21 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="3.5"
              y="0.5"
              width="17"
              height="11"
              rx="1.5"
              stroke="#BCD0D2"
            />
            <path
              d="M0.5 5C0.5 4.17157 1.17157 3.5 2 3.5H3.5V8.5H2C1.17157 8.5 0.5 7.82843 0.5 7V5Z"
              stroke="#BCD0D2"
            />
            <rect x="17" y="2" width="2" height="8" fill="#BCD0D2" />
            <rect x="14" y="2" width="2" height="8" fill="#BCD0D2" />
            <rect x="11" y="2" width="2" height="8" fill="#BCD0D2" />
            <rect x="8" y="2" width="2" height="8" fill="#BCD0D2" />
            <rect x="5" y="2" width="2" height="8" fill="#BCD0D2" />
          </svg>
        </div>
        <div className="ShortcutManager__Panel">
          <div className="ShortcutManager__History">
            History:
            <div className="ShortcutManager__HistoryKeys">
              {ShortcutManagerState.history.map((key, i) => (
                <code key={i}>{key}</code>
              ))}
            </div>
          </div>
          {ShortcutManagerState.layers.map((layer, i) => (
            <dl className="ShortcutManager__Layer" key={i}>
              <header>Layer {String(i).padStart(2, '0')}</header>
              {(layer || []).map((shortcut, j) => (
                <Fragment key={shortcut.chord}>
                  <dt className="Shortcut">{shortcut.chord}</dt>
                  <dd>
                    {shortcut.caption || (j < layer.length - 1 ? '|' : '')}
                  </dd>
                </Fragment>
              ))}
            </dl>
          ))}
        </div>
      </span>
    );
  }
}
