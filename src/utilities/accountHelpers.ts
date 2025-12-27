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

export const generateRandomUsername = () => {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const animal = animals[Math.floor(Math.random() * animals.length)]
  const number = Math.floor(Math.random() * 1000)
  return `${adj}${animal}${number}`
}
