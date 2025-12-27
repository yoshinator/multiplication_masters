const adjectives = [
  'Quick',
  'Lazy',
  'Happy',
  'Sad',
  'Brave',
  'Clever',
  'Witty',
  'Calm',
  'Eager',
  'Gentle',
  'Nimble',
  'Bold',
  'Lucky',
  'Stylish',
  'Fierce',
  'Mighty',
  'Swift',
  'Wise',
  'Jolly',
  'Loyal',
]

const animals = [
  'Lion',
  'Tiger',
  'Bear',
  'Wolf',
  'Fox',
  'Eagle',
  'Shark',
  'Panda',
  'Otter',
  'Hawk',
  'Zebra',
  'Whale',
  'Sloth',
]

/**
 * Generates a random username by combining a random adjective, a random animal,
 * and a random number.
 *
 * The username format is: `<Adjective><Animal><Number>`, for example
 * `"QuickFox123"`. The adjective and animal are chosen uniformly at random
 * from the internal `adjectives` and `animals` lists. The number is an
 * integer in the range 0–999 selected using `Math.random()`.
 *
 * @returns {string} A randomly generated username in the format
 * `<Adjective><Animal><Number>`.
 */
export const generateRandomUsername = () => {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const animal = animals[Math.floor(Math.random() * animals.length)]
  const number = Math.floor(Math.random() * 1000)
  const numberStr = number.toString().padStart(3, '0')
  return `${adj}${animal}${numberStr}`
}
