export const MODIFIERS = {
  ctrlKey: '^',
  altKey: '!',
  shiftKey: '+',
  metaKey: '#',
};

export const RE_REMOVE_MODIFIERS = /[!#^+]+/g;

export function normalizeKey(key: string) {
  const modifiers = Object.values(MODIFIERS)
    .filter(modifier => key.indexOf(modifier) !== -1)
    .join('');
  const characters = key.replace(RE_REMOVE_MODIFIERS, '').toUpperCase();
  return modifiers + characters;
}
