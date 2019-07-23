import * as React from 'react';
import { Component, ChangeEvent } from 'react';
import { render } from 'react-dom';
import './index.css';
import { KeyboardShortcuts } from '../src/keyboard-shortcuts';
import { ShortcutManagerUi } from '../src/shortcut-manager';

const root =
  document.querySelector('#root') ||
  document.body.appendChild(document.createElement('div'));
root.id = 'root';

type Shortcut = { chord: string; caption: string };

interface IState {
  debug: boolean;
  float: boolean;
  shortcuts: Shortcut[];
  value: string;
}

class Application extends Component<{}, IState> {
  state: IState = {
    debug: false,
    float: false,
    shortcuts: [],
    value: '',
  };

  setValue = (value: string) => () => {
    this.setState({ value: value });
  };

  toggleDebugger = () => {
    this.setState({ debug: !this.state.debug });
  };

  toggleFloat = () => {
    this.setState({ float: !this.state.float });
  };

  updateShortcut = (index: number, field: keyof IState['shortcuts'][0]) => (
    event: ChangeEvent
  ) => {
    let { value } = event.target as HTMLInputElement;
    const { shortcuts } = this.state;

    const shortcut = shortcuts[index] || { chord: '', caption: '' };
    shortcut[field] = value;
    shortcuts[index] = shortcut;

    this.setState({
      shortcuts,
    });
  };

  handleClickDelete = (shortcutToRemove: Shortcut) => () => {
    this.setState({
      shortcuts: this.state.shortcuts.filter(
        shortcut => shortcut !== shortcutToRemove
      ),
    });
  };

  render() {
    const { float, shortcuts, value, debug } = this.state;

    return (
      <div className="Example">
        <h1>Keyboard Shortcuts Example</h1>
        <div className="Example__Pinned">
          <h2>Output Area</h2>
          <p>
            This page has keyboard shortcuts on it. You can't easily see what
            keys were pressed in this view, so we'll write what you pressed in
            the box below.
          </p>
          <div className="Example__Value">
            You pressed: <code>{value}</code>
          </div>
        </div>
        {/*************************************************************
          Layer 1
        *************************************************************/}
        <h2>Layer 1</h2>
        <p className="Example__Text">
          This is the first layer of keyboard shortcuts. Every time you use the
          <code>&lt;KeyboardShortcuts /></code> component, it creates a layer.
          This is useful, as you can have a temporary component such as a modal
          that brings its own layers with it. The shortcuts are removed
          automatically when the parent component is removed. (
          <code className="Example__Key">^X</code>
          is overridden, which you will see later)
        </p>
        <KeyboardShortcuts
          shortcuts={{
            // This is a basic chord
            'X A': this.setValue('X then A'),
            // This is Ctrl-X
            '^X': this.setValue('Control X'),
            // This is the left arrow
            ArrowLeft: this.setValue('Left Arrow'),
          }}
        />
        <dl className="Example__Shortcuts">
          <dt className="Example__Shortcut">X A</dt>
          <dd className="Example__ShortcutValue">
            Press <code>X</code> then press <code>A</code>
          </dd>
          <dt className="Example__Shortcut">^X</dt>
          <dd className="Example__ShortcutValue">
            Hold <code>Control</code> and press <code>X</code>
          </dd>
          <dt className="Example__Shortcut">ArrowLeft</dt>
          <dd className="Example__ShortcutValue">
            Press the <code>Left Arrow</code>
          </dd>
        </dl>
        {/*************************************************************
          Layer 2
        *************************************************************/}
        <h2>Layer 2</h2>
        <p>
          This is the second layer of keyboard shortcuts. Each layer overlays on
          top of the layer before it, allowing shortcuts to be added
          progressively. If you add a keyboard shortcut that exists in a lower
          layer, then it will be overridden. In the following example,
          <code className="Example__Key">^X</code> is overridden. You can
          preview this by showing the debug view.
        </p>
        {/*
          You can also define shortcuts with a description in case later you
          want to show a legend programmatically
        */}
        <KeyboardShortcuts
          shortcuts={[
            // Simple shortcut with description
            {
              chord: '+?',
              caption: 'Do something',
              action: this.setValue('Question Mark'),
            },
            {
              chord: '^x',
              caption: 'Override',
              action: this.setValue('Control X (Override)'),
            },
          ]}
        />
        <dl className="Example__Shortcuts">
          <dt className="Example__Shortcut">+?</dt>
          <dd className="Example__ShortcutValue">
            Press the question mark <code>?</code> key
          </dd>
          <dt className="Example__Shortcut">^X</dt>
          <dd className="Example__ShortcutValue">
            This will override the previously defined <code>^X</code>
          </dd>
        </dl>
        {/*************************************************************
          Debug View
        *************************************************************/}
        <h2>Debug View</h2>
        <p>
          You can use the debug view to view the layers in real time. The debug
          view will show you when a shortcut is overridden, and it will allow
          you to see the names of shortcuts if you have provided them.{' '}
        </p>
        <p>
          <button
            onClick={this.toggleDebugger}
            className="Example__Button Example__Button--big"
          >
            {debug ? 'Disable' : 'Enable'} Debugger
          </button>
        </p>
        <div
          className={`Example__DebugView ${
            float ? 'Example__DebugView--float' : ''
          }`}
        >
          {debug && (
            <button className="Example__Button" onClick={this.toggleFloat}>
              {float && 'Un'}Float
            </button>
          )}
          <ShortcutManagerUi visible={debug} />
        </div>
        <p>
          The debug view also has a key preview system, so if you know what the
          keys are on the keyboard, but you don't know what they are in code,
          then you can open the debug window, press the key combination, and
          copy those out into code.
        </p>
        {/*************************************************************
          Layer 3
        *************************************************************/}
        <h2>Layer 3</h2>
        <p>
          This is a layer that you create. Add keyboard shortcuts in here and
          you will see them take effect immediately. Keyboard shortcuts are very
          easy to add and remove real-time by simply updating the react
          component.
        </p>
        {/*
          These are dynamic keyboard shortcuts
        */}
        <KeyboardShortcuts
          shortcuts={shortcuts.map(shortcut => ({
            chord: shortcut.chord,
            caption: shortcut.caption,
            action: this.setValue(shortcut.caption || shortcut.chord),
          }))}
        />
        <table className="CustomShortcuts">
          <thead>
            <tr>
              <th>Chord</th>
              <th>Caption &amp; Value</th>
              <th>&nbsp;</th>
            </tr>
          </thead>
          <tbody>
            {shortcuts.concat({ chord: '', caption: '' }).map((shortcut, i) => (
              <tr key={i}>
                <td className="CustomShortcuts__Chord">
                  <input
                    className="CustomShortcuts__Input"
                    type="text"
                    value={shortcut.chord}
                    onChange={this.updateShortcut(i, 'chord')}
                  />
                </td>
                <td className="CustomShortcuts__Caption">
                  <input
                    className="CustomShortcuts__Input"
                    type="text"
                    value={shortcut.caption}
                    placeholder={shortcut.chord}
                    onChange={this.updateShortcut(i, 'caption')}
                  />
                </td>
                <td>
                  <button
                    className="Example__Button"
                    onClick={this.handleClickDelete(shortcut)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          Remember that in order to make a chord, you must separate characters
          by a space. For example, <code className="Example__Key">XA</code>{' '}
          would be impossible to type, whereas{' '}
          <code className="Example__Key">X A</code> means type{' '}
          <code className="Example__Key">X</code> followed by{' '}
          <code className="Example__Key">A</code>
        </p>
      </div>
    );
  }
}

render(<Application />, root);
