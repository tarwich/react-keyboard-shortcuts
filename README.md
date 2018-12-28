# React Keyboard Shortcuts

## Why did you do it?

I wanted a way to easily manage adding keyboard shortcuts to the DOM, while
managing them. I've seen things that allow defining keyboard shortcuts for the
entire life of the application, but most of the time the keyboard shortcuts that
I want to create are very context-sensitive. They only need to occur for one
modal or one screen of the application. So this extension brings you the
following:

- Component to register keyboard shortcuts easily
- As a component, it can be mounted inside any React component
- If another component is mounted afterwords, it can override shortcuts
- Since it has a React lifecycle, it will register and unregister shortcuts
  automatically
- The React lifecycle causes shortcuts to update automatically in case something
  in your application changes them after they're registered

## How to use it

```sh
npm install @tarwich/react-keyboard-shortcuts
```

```jsx
import * as React from 'react';
import { render } from 'react-dom';
import { KeyboardShortcuts } from 'react-keyboard-shortcuts';

const root = document.querySelector('#root') ||
  document.body.appendChild(document.createElement('div'))
;

render(
  <KeyboardShortcuts shortcuts={{
    '^x': () => { console.log('You pressed control X!'); }
  }} />,
  root
);
```

## Simple way to define shortcuts

You can define shortcuts with a simple object, where they object keys are the
keyboard keys, and the action is the value. This method is less flexible, but a
lot easier to get started with.

```js
<KeyboardShortcuts shortcuts={{
  'a': () => console.log('You pressed "a"'),
  'b': () => console.log('You pressed "b"'),
}} />
```

## Modifier keys

The modifier keys for the keyboard shortcuts are currently the following. If
more are needed, then either we'll add definitions for them, or change the
approach.

| Code | Actual Key |
| :--: | :--------: |
| ^    | Control    |
| !    | Alt        |
| +    | Shift      |
| #    | Meta       |

## Chords

This shortcut system has heavy emphasis on chords. In fact, I recommend that you do **NOT** rely heavily on modifiers, but instead chords.

In Gmail, for example, the chord `G I` means "_Go to inbox_". You can easily press that combination without needing fancy meta keys, and now that I've gotten used to it, it's much easier to think `G <something>` will take me anywhere than remembering `^I` is inbox, and `^D` is drafts (or was it _duplicate_ or _delete_`?)

In order to make chords, use a space to separate keys. Here are some examples:

| Chord   | Description |
| ---     | ---         |
| `X`     | Not a chord. Just press X |
| `X A`   | Press X, then press A |
| `^X !A` | Press Control-X, then press Alt-A |
| `XA`    | Error. This is impossible to invoke |

With chords, you can even do "cheat codes"

### The Doom cheat code
`I D D K D`

### Konami cheat code
`ArrowUp ArrowUp ArrowDown ArrowDown ArrowLeft ArrowRight ArrowLeft ArrowRight B A` Konami!

## Debug mode

If you enable debug mode, then you'll get a window on the screen that will help
you identify what shortcuts are registered, which ones are overridden, and what
keys are being pressed.

Being able to get information on what keys is being pressed is super useful as you can find the codes for non-obvious things like `MediaVolumeUp`.

```jsx
<KeyboardShortcuts
  debug={true}
  shortcuts={/* Something goes here */}
/>
```

## Complex configuration

```jsx
<KeyboardShortcuts
  shortcuts={[
    {chord: 'G I', caption: 'Go to inbox', () => this.gotoInbox() },
    {chord: 'G D', caption: 'Go to drafts', () => this.gotoDrafts() },
  ]}
/>
```
