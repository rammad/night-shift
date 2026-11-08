// Deliberate typos are the player's dialogue. Line breaks fit the phone display.
export const MESSAGE_SECONDS = 2.5;
export const CONVERSATION = [
  { who: 'BOSS', lines: ['need you to', 'file that', 'paperwork', 'TONIGHT!!'] },
  { who: 'YOU', lines: ['i juts got', 'homb ffrom', 'the bar'] },
  { who: 'YOU', lines: ['drunk'] },
  { who: 'BOSS', lines: ['tonight.'] },
  { who: 'BOSS', lines: ['or youre', 'fired.'] },
];
export const CONVERSATION_SECONDS = CONVERSATION.length * MESSAGE_SECONDS;
