import { observer } from 'mobx-react';
import { Component } from 'react';
import { Shortcut } from './shortcut';
import { ShortcutLayer } from './shortcut-layer';
import { observable } from 'mobx';
import { comparer } from 'mobx';
import { HotkeyActions } from './hotkey-actions';

interface IProps {
  debug?: boolean;
  shortcuts: { [chord: string]: () => void } | Shortcut[];
}

// FIXME: I don't think this needs to be an @observer
@observer
export class HotkeyLayer extends Component<IProps> {
  shortcuts: {};
  // FIXME: I don't think this needs to be @observable
  @observable layer: ShortcutLayer;

  componentDidMount() {
    HotkeyActions.installEventListeners();
    this.layer = HotkeyActions.addLayer(this.props.shortcuts);
  }

  componentDidUpdate(props: IProps) {
    if (!comparer.structural(props.shortcuts, this.props.shortcuts)) {
      this.layer = HotkeyActions.updateLayer(this.layer, this.props.shortcuts);
    }
  }

  componentWillUnmount() {
    HotkeyActions.removeLayer(this.layer);
  }

  render() {
    return null;
  }
}
