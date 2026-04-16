import { describe, it, expect } from 'vitest'
import {
  TEAMS,
  getTeamByIndex,
  getNextTeam,
  pickRandomUnusedTeam,
} from './teams'

describe('TEAMS', () => {
  it('has exactly 30 entries', () => {
    expect(TEAMS).toHaveLength(30)
  })

  it('every team has a non-empty name string', () => {
    for (const team of TEAMS) {
      expect(typeof team.name).toBe('string')
      expect(team.name.length).toBeGreaterThan(0)
    }
  })

  it('every team has a valid hex colour', () => {
    for (const team of TEAMS) {
      expect(team.colour).toMatch(/^#[0-9A-Fa-f]{6}$/)
    }
  })

  it('every team has an index matching its position in the array', () => {
    for (let i = 0; i < TEAMS.length; i++) {
      expect(TEAMS[i].index).toBe(i)
    }
  })

  it('all team names are unique', () => {
    const names = TEAMS.map((t) => t.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('all team colours are unique', () => {
    const colours = TEAMS.map((t) => t.colour)
    expect(new Set(colours).size).toBe(colours.length)
  })
})

describe('getTeamByIndex', () => {
  it('returns Red Rabbits for index 0', () => {
    const team = getTeamByIndex(0)
    expect(team).toEqual({ index: 0, name: 'Red Rabbits', colour: '#E03131' })
  })

  it('returns Gold Gorillas for index 14', () => {
    const team = getTeamByIndex(14)
    expect(team).toEqual({
      index: 14,
      name: 'Gold Gorillas',
      colour: '#DAA520',
    })
  })

  it('returns Copper Chameleons for index 29', () => {
    const team = getTeamByIndex(29)
    expect(team).toEqual({
      index: 29,
      name: 'Copper Chameleons',
      colour: '#B87333',
    })
  })

  it('returns undefined for index 30', () => {
    expect(getTeamByIndex(30)).toBeUndefined()
  })

  it('returns undefined for index -1', () => {
    expect(getTeamByIndex(-1)).toBeUndefined()
  })
})

describe('getNextTeam', () => {
  it('returns the first team when current count is 0', () => {
    const team = getNextTeam(0)
    expect(team).toEqual({ index: 0, name: 'Red Rabbits', colour: '#E03131' })
  })

  it('returns the 16th team when current count is 15', () => {
    const team = getNextTeam(15)
    expect(team).toEqual({
      index: 15,
      name: 'Crimson Cranes',
      colour: '#C92A2A',
    })
  })

  it('returns the 30th team when current count is 29', () => {
    const team = getNextTeam(29)
    expect(team).toEqual({
      index: 29,
      name: 'Copper Chameleons',
      colour: '#B87333',
    })
  })

  it('returns null when current count is 30', () => {
    expect(getNextTeam(30)).toBeNull()
  })
})

describe('pickRandomUnusedTeam', () => {
  it('returns a team not in the used list', () => {
    const used = TEAMS.slice(0, 5).map((t) => t.name)
    for (let i = 0; i < 10; i++) {
      const picked = pickRandomUnusedTeam(used)
      expect(picked).not.toBeNull()
      if (picked) {
        expect(used).not.toContain(picked.name)
      }
    }
  })

  it('returns null when every team is used', () => {
    const used = TEAMS.map((t) => t.name)
    expect(pickRandomUnusedTeam(used)).toBeNull()
  })

  it('is non-deterministic across calls for an empty used list', () => {
    const picks = new Set<string>()
    for (let i = 0; i < 50; i++) {
      const picked = pickRandomUnusedTeam([])
      if (picked) picks.add(picked.name)
    }
    expect(picks.size).toBeGreaterThan(1)
  })
})
