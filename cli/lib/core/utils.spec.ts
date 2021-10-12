import { sliceTopGroup } from './utils'

describe('sliceTopGroup', () => {

  test('returns empty', () => {
    const sliced = sliceTopGroup([], 10, (a, b) => a - b)

    expect(sliced).toEqual([])
  })

  test('returns all', () => {
    const sliced = sliceTopGroup([3, 2, 1], 5, (a, b) => a - b)

    expect(sliced).toIncludeSameMembers([1, 2, 3])
  })

  test('returns ordered slice', () => {
    const sliced = sliceTopGroup([3, 2, 1, 0], 2, (a, b) => a - b)

    expect(sliced).toIncludeSameMembers([0, 1])
  })

  test('returns more if same', () => {
    const sliced = sliceTopGroup([3, 2, 2, 2, 1, 0], 3, (a, b) => a - b)

    expect(sliced).toIncludeSameMembers([0, 1, 2, 2, 2])
  })

  test('returns no more than repeated', () => {
    const sliced = sliceTopGroup([3, 2, 2, 2, 1, 0], 5, (a, b) => a - b)

    expect(sliced).toIncludeSameMembers([0, 1, 2, 2, 2])
  })

  test('returns repeated and more', () => {
    const sliced = sliceTopGroup([4, 3, 3, 2, 2, 2, 1, 0], 6, (a, b) => a - b)

    expect(sliced).toIncludeSameMembers([0, 1, 2, 2, 2, 3, 3])
  })

})
