const WORDS: Record<string, string[]> = {
  animals: [
    'cat', 'dog', 'fish', 'bird', 'horse', 'cow', 'pig', 'sheep',
    'duck', 'frog', 'bear', 'lion', 'tiger', 'elephant', 'giraffe',
    'monkey', 'penguin', 'shark', 'butterfly', 'snake', 'rabbit',
    'owl', 'dolphin', 'turtle', 'parrot',
  ],
  objects: [
    'book', 'chair', 'table', 'clock', 'phone', 'key', 'lamp', 'mirror',
    'window', 'door', 'umbrella', 'bottle', 'pencil', 'scissors', 'backpack',
    'camera', 'watch', 'balloon', 'ladder', 'comb', 'hammer', 'candle',
    'basket', 'pillow', 'globe',
  ],
  food: [
    'apple', 'banana', 'bread', 'cake', 'pizza', 'burger', 'salad', 'pasta',
    'rice', 'egg', 'cheese', 'cookie', 'icecream', 'grape', 'watermelon',
    'donut', 'sandwich', 'popcorn', 'chocolate', 'sushi', 'taco', 'pancake',
    'mango', 'carrot', 'cupcake',
  ],
  actions: [
    'jump', 'run', 'swim', 'dance', 'sing', 'sleep', 'eat', 'drink',
    'read', 'write', 'climb', 'throw', 'catch', 'push', 'pull',
    'kick', 'wave', 'laugh', 'cry', 'whistle', 'slide', 'skate',
    'clap', 'hug', 'dig',
  ],
  places: [
    'beach', 'mountain', 'forest', 'river', 'bridge', 'castle', 'church',
    'school', 'hospital', 'airport', 'museum', 'park', 'farm', 'market',
    'library', 'stadium', 'harbor', 'cave', 'island', 'desert', 'temple',
    'lighthouse', 'volcano', 'waterfall', 'garden',
  ],
};

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomCategory(): string {
  const categories = Object.keys(WORDS);
  return getRandomElement(categories);
}

export function getRandomWord(category?: string): { word: string; category: string } {
  const cat = category && WORDS[category] ? category : getRandomCategory();
  const word = getRandomElement(WORDS[cat]);
  return { word, category: cat };
}

export function getCategories(): string[] {
  return Object.keys(WORDS);
}

export function isWordInBank(word: string, category?: string): boolean {
  const lowerWord = word.toLowerCase();
  if (category && WORDS[category]) {
    return WORDS[category].includes(lowerWord);
  }
  return Object.values(WORDS).some((words) => words.includes(lowerWord));
}
