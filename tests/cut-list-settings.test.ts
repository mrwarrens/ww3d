import { describe, it, expect, beforeEach } from 'vitest'
import { serializeProject, deserializeProject, createProject, type CutListSettings } from '../src/models/Project'
import { useProjectStore } from '../src/stores/projectStore'

const emptySettings: CutListSettings = { sheetGoods: {}, hardwood: {}, dimensional: {} }

describe('CutListSettings serialization', () => {
  it('round-trips populated settings', () => {
    const project = {
      ...createProject('Test'),
      cutListSettings: {
        sheetGoods: { plywood: { sheetWidth: 48, sheetHeight: 96 } },
        hardwood: { maple: { boardWidth: 6, boardLength: 96 } },
        dimensional: { '2x4': { availableLengths: [96, 120, 144] } },
      } satisfies CutListSettings,
    }
    const result = deserializeProject(serializeProject(project))
    expect(result.cutListSettings).toEqual(project.cutListSettings)
  })

  it('defaults to empty sub-records when absent from JSON', () => {
    const project = createProject('Old Project')
    const json = JSON.stringify({ ...project, cutListSettings: undefined })
    const result = deserializeProject(json)
    expect(result.cutListSettings).toEqual(emptySettings)
  })

  it('defaults when cutListSettings key is missing entirely', () => {
    const { cutListSettings: _dropped, ...rest } = { ...createProject('Old'), cutListSettings: emptySettings }
    const json = JSON.stringify(rest)
    const result = deserializeProject(json)
    expect(result.cutListSettings).toEqual(emptySettings)
  })
})

describe('updateCutListSettings store action', () => {
  beforeEach(() => {
    useProjectStore.setState({
      project: createProject('Test'),
      history: [],
      future: [],
    })
  })

  it('starts with no cutListSettings (or empty)', () => {
    const { project } = useProjectStore.getState()
    expect(project.cutListSettings ?? emptySettings).toEqual(emptySettings)
  })

  it('updates cutListSettings and pushes undo history', () => {
    const settings: CutListSettings = {
      sheetGoods: { plywood: { sheetWidth: 48, sheetHeight: 96 } },
      hardwood: {},
      dimensional: {},
    }
    useProjectStore.getState().updateCutListSettings(settings)
    const state = useProjectStore.getState()
    expect(state.project.cutListSettings).toEqual(settings)
    expect(state.history).toHaveLength(1)
    expect(state.future).toHaveLength(0)
  })

  it('undo reverts cutListSettings', () => {
    const settings: CutListSettings = {
      sheetGoods: { mdf: { sheetWidth: 49, sheetHeight: 97 } },
      hardwood: {},
      dimensional: {},
    }
    useProjectStore.getState().updateCutListSettings(settings)
    useProjectStore.getState().undo()
    const { project } = useProjectStore.getState()
    expect(project.cutListSettings ?? emptySettings).toEqual(emptySettings)
  })
})
