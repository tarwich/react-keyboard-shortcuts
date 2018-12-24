import { createElement, Component } from 'react';
import { render } from 'react-dom';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import './index.css';
import { KeyboardShortcuts } from '../src/keyboard-shortcuts';

const root =
  document.querySelector('#root') ||
  document.body.appendChild(document.createElement('div'));
root.id = 'root';

@observer
class Application extends Component {
  @observable
  keys = {
    ab: 'NO',
    ac: 'NO',
  };
  @observable value = '';

  render() {
    return (
      <div>
        <KeyboardShortcuts
          shortcuts={{
            'x a': () => (this.value = 'One'),
            'x b': () => (this.value = 'Two'),
            '^x': () => (this.value = 'Three'),
            '^c ^x': () => (this.value = 'Four'),
          }}
        />
        <div>Activated: {this.value}</div>
        Keyboard Shortcuts:
        <dl>
          <dt>
            <code>X</code>, <code>A</code>
          </dt>
          <dd>One</dd>
          <dt>
            <code>X</code>, <code>B</code>
          </dt>
          <dd>Two</dd>
          <dt>
            <code>^X</code>
          </dt>
          <dd>Three</dd>
          <dt>
            <code>^C</code>, <code>^X</code>
          </dt>
          <dd>Four</dd>
        </dl>
      </div>
    );
  }
}

render(<Application />, root);
