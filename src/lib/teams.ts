type Team = {
  index: number
  name: string
  colour: string
}

export const TEAMS: Team[] = [
  { index: 0, name: 'Red Rabbits', colour: '#E03131' },
  { index: 1, name: 'Orange Ocelots', colour: '#E8590C' },
  { index: 2, name: 'Yellow Yaks', colour: '#F59F00' },
  { index: 3, name: 'Lime Llamas', colour: '#74B816' },
  { index: 4, name: 'Green Geckos', colour: '#2F9E44' },
  { index: 5, name: 'Teal Turtles', colour: '#099268' },
  { index: 6, name: 'Cyan Coyotes', colour: '#0C8599' },
  { index: 7, name: 'Blue Bats', colour: '#1971C2' },
  { index: 8, name: 'Indigo Iguanas', colour: '#4263EB' },
  { index: 9, name: 'Purple Pandas', colour: '#7048E8' },
  { index: 10, name: 'Violet Vultures', colour: '#9C36B5' },
  { index: 11, name: 'Pink Parrots', colour: '#D6336C' },
  { index: 12, name: 'Brown Bears', colour: '#A0522D' },
  { index: 13, name: 'Coral Cats', colour: '#FF6B6B' },
  { index: 14, name: 'Gold Gorillas', colour: '#DAA520' },
  { index: 15, name: 'Crimson Cranes', colour: '#C92A2A' },
  { index: 16, name: 'Amber Antelopes', colour: '#FF922B' },
  { index: 17, name: 'Sage Salamanders', colour: '#5C940D' },
  { index: 18, name: 'Emerald Eagles', colour: '#20C997' },
  { index: 19, name: 'Aqua Axolotls', colour: '#22B8CF' },
  { index: 20, name: 'Navy Newts', colour: '#1B4F99' },
  { index: 21, name: 'Magenta Monkeys', colour: '#CC5DE8' },
  { index: 22, name: 'Peach Penguins', colour: '#FF8787' },
  { index: 23, name: 'Maroon Meerkats', colour: '#862E2E' },
  { index: 24, name: 'Tangerine Tigers', colour: '#FD7E14' },
  { index: 25, name: 'Mint Mantises', colour: '#63E6BE' },
  { index: 26, name: 'Slate Sharks', colour: '#5C7CFA' },
  { index: 27, name: 'Plum Platypuses', colour: '#845EF7' },
  { index: 28, name: 'Rose Raccoons', colour: '#F06595' },
  { index: 29, name: 'Copper Chameleons', colour: '#B87333' },
]

export function getTeamByIndex(index: number): Team | undefined {
  return TEAMS[index]
}

export function getNextTeam(currentTeamCount: number): Team | null {
  return TEAMS[currentTeamCount] ?? null
}

export function pickRandomUnusedTeam(usedNames: string[]): Team | null {
  const used = new Set(usedNames)
  const available = TEAMS.filter((t) => !used.has(t.name))
  if (available.length === 0) return null
  const index = Math.floor(Math.random() * available.length)
  return available[index]
}
