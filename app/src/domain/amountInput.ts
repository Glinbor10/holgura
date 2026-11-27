const MAX_INTEGER_DIGITS = 7;

/** Applies a keypad key ("0"-"9", ",", "back") to the amount text typed so far. */
export const pressKey = (text: string, key: string): string => {
  if (key === 'back') {
    return text.slice(0, -1);
  }
  if (key === ',') {
    return text.includes(',') ? text : `${text === '' ? '0' : text},`;
  }
  const [integer, decimals] = text.split(',');
  if (decimals !== undefined) {
    return decimals.length < 2 ? text + key : text;
  }
  if (integer === '0') {
    return key;
  }
  return integer.length < MAX_INTEGER_DIGITS ? text + key : text;
};
