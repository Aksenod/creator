import { describe, it, expect, vi } from 'vitest'
import { create } from 'zustand'
import type { EditorState } from './types'
import { createProjectSlice } from './slices/projectSlice'
import { createArtboardSlice } from './slices/artboardSlice'
import { createSelectionSlice } from './slices/selectionSlice'
import { createElementSlice } from './slices/elementSlice'
import { createHistorySlice } from './slices/historySlice'
import { createUiSlice } from './slices/uiSlice'

// Create a plain store without persist middleware for testing
function createTestStore() {
  return create<EditorState>()((...a) => ({
    ...createProjectSlice(...a),
    ...createArtboardSlice(...a),
    ...createSelectionSlice(...a),
    ...createElementSlice(...a),
    ...createHistorySlice(...a),
    ...createUiSlice(...a),
  }))
}

// Mock localStorage for copy/paste
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

// Mock window for uiSlice
if (typeof window === 'undefined') {
  (globalThis as any).window = { location: { pathname: '/' }, history: { pushState: vi.fn() } }
}

type TestStore = ReturnType<typeof createTestStore>

// Helper: create a store with one project (to simplify most tests)
function storeWithProject(): TestStore {
  const store = createTestStore()
  store.getState().createProject('Test Project')
  return store
}

// ===========================
// ProjectSlice
// ===========================
describe('ProjectSlice', () => {
  it('createProject sets project, activeProjectId, activeArtboardId', () => {
    const store = createTestStore()
    store.getState().createProject('My Site')
    const s = store.getState()
    expect(s.project).not.toBeNull()
    expect(s.project!.name).toBe('My Site')
    expect(s.activeProjectId).toBe(s.project!.id)
    expect(s.activeArtboardId).toBeTruthy()
    expect(s.allProjects.length).toBeGreaterThanOrEqual(1)
  })

  it('createProject creates artboard with body', () => {
    const store = storeWithProject()
    const s = store.getState()
    const abId = s.project!.artboardOrder[0]
    const ab = s.project!.artboards[abId]
    expect(ab).toBeDefined()
    expect(ab.rootChildren.length).toBe(1)
    const body = ab.elements[ab.rootChildren[0]]
    expect(body.type).toBe('body')
  })

  it('openProject switches to another project', () => {
    const store = createTestStore()
    store.getState().createProject('Project A')
    const idA = store.getState().project!.id
    store.getState().closeProject() // saves A to allProjects
    store.getState().createProject('Project B')
    store.getState().project!.id // idB - created but we switch away

    store.getState().openProject(idA)
    expect(store.getState().activeProjectId).toBe(idA)
    expect(store.getState().project!.id).toBe(idA)
  })

  it('openProject resets selection', () => {
    const store = storeWithProject()
    const s = store.getState()
    s.selectElement('some-id')
    s.openProject(s.project!.id)
    expect(store.getState().selectedElementId).toBeNull()
    expect(store.getState().selectedElementIds).toEqual([])
  })

  it('closeProject clears project state', () => {
    const store = storeWithProject()
    store.getState().closeProject()
    const s = store.getState()
    expect(s.project).toBeNull()
    expect(s.activeProjectId).toBeNull()
    expect(s.activeArtboardId).toBeNull()
  })

  it('closeProject preserves project in allProjects', () => {
    const store = storeWithProject()
    const pid = store.getState().project!.id
    store.getState().closeProject()
    expect(store.getState().allProjects.some(p => p.id === pid)).toBe(true)
  })

  it('deleteProject removes from allProjects', () => {
    const store = storeWithProject()
    const pid = store.getState().project!.id
    store.getState().closeProject()
    store.getState().deleteProject(pid)
    expect(store.getState().allProjects.some(p => p.id === pid)).toBe(false)
  })

  it('deleteProject clears state if active project deleted', () => {
    const store = storeWithProject()
    const pid = store.getState().project!.id
    store.getState().deleteProject(pid)
    expect(store.getState().project).toBeNull()
    expect(store.getState().activeProjectId).toBeNull()
  })

  it('renameProject updates name', () => {
    const store = storeWithProject()
    const pid = store.getState().project!.id
    store.getState().renameProject(pid, 'New Name')
    expect(store.getState().project!.name).toBe('New Name')
    expect(store.getState().allProjects.find(p => p.id === pid)!.name).toBe('New Name')
  })

  it('duplicateProject creates a copy', () => {
    const store = storeWithProject()
    const pid = store.getState().project!.id
    store.getState().closeProject() // save to allProjects
    const countBefore = store.getState().allProjects.length
    store.getState().duplicateProject(pid)
    expect(store.getState().allProjects.length).toBe(countBefore + 1)
    const copy = store.getState().allProjects[store.getState().allProjects.length - 1]
    expect(copy.name).toContain('(copy)')
    expect(copy.id).not.toBe(pid)
  })

  it('loadProject sets project and resets state', () => {
    const store = createTestStore()
    store.getState().createProject('Old')
    const project = store.getState().project!

    const store2 = createTestStore()
    store2.getState().loadProject(project)
    expect(store2.getState().project!.id).toBe(project.id)
    expect(store2.getState().activeProjectId).toBe(project.id)
    expect(store2.getState().history).toEqual([])
  })
})

// ===========================
// ArtboardSlice
// ===========================
describe('ArtboardSlice', () => {
  it('addArtboard creates a new artboard', () => {
    const store = storeWithProject()
    const orderBefore = store.getState().project!.artboardOrder.length
    store.getState().addArtboard('Page 2')
    expect(store.getState().project!.artboardOrder.length).toBe(orderBefore + 1)
  })

  it('addArtboard positions new artboard after last', () => {
    const store = storeWithProject()
    const s1 = store.getState()
    const firstId = s1.project!.artboardOrder[0]
    const firstAb = s1.project!.artboards[firstId]

    store.getState().addArtboard('Page 2')
    const s2 = store.getState()
    const secondId = s2.project!.artboardOrder[1]
    const secondAb = s2.project!.artboards[secondId]
    expect(secondAb.x).toBe(firstAb.x + firstAb.width + 100)
  })

  it('addArtboard pushes history', () => {
    const store = storeWithProject()
    store.getState().addArtboard('New')
    expect(store.getState().history.length).toBeGreaterThan(0)
  })

  it('deleteArtboard removes artboard', () => {
    const store = storeWithProject()
    store.getState().addArtboard('Page 2')
    const order = store.getState().project!.artboardOrder
    expect(order.length).toBe(2)

    store.getState().deleteArtboard(order[1])
    expect(store.getState().project!.artboardOrder.length).toBe(1)
  })

  it('deleteArtboard prevents removing last artboard', () => {
    const store = storeWithProject()
    const onlyId = store.getState().project!.artboardOrder[0]
    store.getState().deleteArtboard(onlyId)
    expect(store.getState().project!.artboardOrder.length).toBe(1)
  })

  it('deleteArtboard switches activeArtboardId if deleted was active', () => {
    const store = storeWithProject()
    store.getState().addArtboard('Page 2')
    const order = store.getState().project!.artboardOrder
    store.getState().setActiveArtboard(order[1])
    store.getState().deleteArtboard(order[1])
    expect(store.getState().activeArtboardId).toBe(order[0])
  })

  it('moveArtboard updates coordinates with history', () => {
    const store = storeWithProject()
    const abId = store.getState().project!.artboardOrder[0]
    store.getState().moveArtboard(abId, 500, 600)
    const ab = store.getState().project!.artboards[abId]
    expect(ab.x).toBe(500)
    expect(ab.y).toBe(600)
    expect(store.getState().history.length).toBeGreaterThan(0)
  })

  it('moveArtboardTemp updates without history', () => {
    const store = storeWithProject()
    const histBefore = store.getState().history.length
    const abId = store.getState().project!.artboardOrder[0]
    store.getState().moveArtboardTemp(abId, 300, 400)
    expect(store.getState().project!.artboards[abId].x).toBe(300)
    expect(store.getState().history.length).toBe(histBefore)
  })

  it('updateArtboard patches artboard properties', () => {
    const store = storeWithProject()
    const abId = store.getState().project!.artboardOrder[0]
    store.getState().updateArtboard(abId, { name: 'Renamed', height: 1200 })
    const ab = store.getState().project!.artboards[abId]
    expect(ab.name).toBe('Renamed')
    expect(ab.height).toBe(1200)
  })

  it('setActiveArtboard changes active artboard', () => {
    const store = storeWithProject()
    store.getState().addArtboard('Page 2')
    const order = store.getState().project!.artboardOrder
    store.getState().setActiveArtboard(order[1])
    expect(store.getState().activeArtboardId).toBe(order[1])
  })

  it('setActiveArtboard resets selection', () => {
    const store = storeWithProject()
    store.getState().addArtboard('Page 2')
    const abId = store.getState().project!.artboardOrder[0]
    const bodyId = store.getState().project!.artboards[abId].rootChildren[0]
    store.getState().selectElement(bodyId)

    const order = store.getState().project!.artboardOrder
    store.getState().setActiveArtboard(order[1])
    expect(store.getState().selectedElementId).toBeNull()
  })
})

// ===========================
// SelectionSlice
// ===========================
describe('SelectionSlice', () => {
  it('selectElement sets single selection', () => {
    const store = storeWithProject()
    store.getState().selectElement('el1')
    expect(store.getState().selectedElementId).toBe('el1')
    expect(store.getState().selectedElementIds).toEqual(['el1'])
  })

  it('selectElement with null clears selection', () => {
    const store = storeWithProject()
    store.getState().selectElement('el1')
    store.getState().selectElement(null)
    expect(store.getState().selectedElementId).toBeNull()
    expect(store.getState().selectedElementIds).toEqual([])
  })

  it('selectElements sets multiple selection', () => {
    const store = storeWithProject()
    store.getState().selectElements(['a', 'b', 'c'])
    expect(store.getState().selectedElementIds).toEqual(['a', 'b', 'c'])
    expect(store.getState().selectedElementId).toBe('a')
  })

  it('selectElements with empty array clears', () => {
    const store = storeWithProject()
    store.getState().selectElements(['a'])
    store.getState().selectElements([])
    expect(store.getState().selectedElementId).toBeNull()
  })

  it('toggleSelectElement adds if not present', () => {
    const store = storeWithProject()
    store.getState().toggleSelectElement('a')
    expect(store.getState().selectedElementIds).toContain('a')
  })

  it('toggleSelectElement removes if present', () => {
    const store = storeWithProject()
    store.getState().selectElements(['a', 'b'])
    store.getState().toggleSelectElement('a')
    expect(store.getState().selectedElementIds).not.toContain('a')
    expect(store.getState().selectedElementIds).toContain('b')
  })

  it('selectArtboards sets artboard selection and clears element selection', () => {
    const store = storeWithProject()
    store.getState().selectElement('el1')
    store.getState().selectArtboards(['ab1', 'ab2'])
    expect(store.getState().selectedArtboardIds).toEqual(['ab1', 'ab2'])
    expect(store.getState().selectedElementId).toBeNull()
    expect(store.getState().selectedElementIds).toEqual([])
  })
})

// ===========================
// ElementSlice
// ===========================
describe('ElementSlice', () => {
  // Helper to get current artboard and body
  function getAb(store: TestStore) {
    const s = store.getState()
    const abId = s.activeArtboardId!
    const ab = s.project!.artboards[abId]
    return { abId, ab }
  }

  function getBody(store: TestStore) {
    const { abId, ab } = getAb(store)
    const bodyId = ab.rootChildren.find(id => ab.elements[id]?.type === 'body')!
    return { abId, bodyId, body: ab.elements[bodyId] }
  }

  describe('addElement', () => {
    it('adds a div element', () => {
      const store = storeWithProject()
      const { abId, bodyId } = getBody(store)
      store.getState().addElement(abId, 'div', bodyId)
      const { ab } = getAb(store)
      const body = ab.elements[ab.rootChildren.find(id => ab.elements[id]?.type === 'body')!]
      expect(body.children.length).toBe(1)
      const child = ab.elements[body.children[0]]
      expect(child.type).toBe('div')
    })

    it('adds text element with default content', () => {
      const store = storeWithProject()
      const { abId, bodyId } = getBody(store)
      store.getState().addElement(abId, 'text', bodyId)
      const { ab } = getAb(store)
      const body = ab.elements[ab.rootChildren.find(id => ab.elements[id]?.type === 'body')!]
      const textEl = ab.elements[body.children[0]]
      expect(textEl.content).toBe('Текст')
    })

    it('adds button element with default content', () => {
      const store = storeWithProject()
      const { abId, bodyId } = getBody(store)
      store.getState().addElement(abId, 'button', bodyId)
      const { ab } = getAb(store)
      const body = ab.elements[ab.rootChildren.find(id => ab.elements[id]?.type === 'body')!]
      const btnEl = ab.elements[body.children[0]]
      expect(btnEl.content).toBe('Кнопка')
    })

    it('adds image element with src and alt', () => {
      const store = storeWithProject()
      const { abId, bodyId } = getBody(store)
      store.getState().addElement(abId, 'image', bodyId)
      const { ab } = getAb(store)
      const body = ab.elements[ab.rootChildren.find(id => ab.elements[id]?.type === 'body')!]
      const imgEl = ab.elements[body.children[0]]
      expect(imgEl.type).toBe('image')
      expect(imgEl).toHaveProperty('src')
      expect(imgEl).toHaveProperty('alt')
    })

    it('adds input element with inputType', () => {
      const store = storeWithProject()
      const { abId, bodyId } = getBody(store)
      store.getState().addElement(abId, 'input', bodyId)
      const { ab } = getAb(store)
      const body = ab.elements[ab.rootChildren.find(id => ab.elements[id]?.type === 'body')!]
      const inputEl = ab.elements[body.children[0]]
      expect(inputEl.inputType).toBe('text')
    })

    it('selects newly added element', () => {
      const store = storeWithProject()
      const { abId, bodyId } = getBody(store)
      store.getState().addElement(abId, 'div', bodyId)
      const s = store.getState()
      expect(s.selectedElementId).toBeTruthy()
      expect(s.selectedElementIds).toHaveLength(1)
    })

    it('adds after sibling when parentId is non-container', () => {
      const store = storeWithProject()
      const { abId, bodyId } = getBody(store)
      store.getState().addElement(abId, 'text', bodyId) // text1
      const textId = store.getState().selectedElementId!
      store.getState().addElement(abId, 'text', textId) // text2 after text1
      const { ab } = getAb(store)
      const body = ab.elements[ab.rootChildren.find(id => ab.elements[id]?.type === 'body')!]
      expect(body.children.length).toBe(2)
      expect(body.children[0]).toBe(textId) // original first
    })

    it('pushes history', () => {
      const store = storeWithProject()
      const { abId, bodyId } = getBody(store)
      store.getState().addElement(abId, 'div', bodyId)
      expect(store.getState().history.length).toBeGreaterThan(0)
    })
  })

  describe('updateElement', () => {
    it('updates element name', () => {
      const store = storeWithProject()
      const { abId, bodyId } = getBody(store)
      store.getState().addElement(abId, 'div', bodyId)
      const divId = store.getState().selectedElementId!
      store.getState().updateElement(abId, divId, { name: 'Container' })
      expect(store.getState().project!.artboards[abId].elements[divId].name).toBe('Container')
    })

    it('auto-slugifies className from name', () => {
      const store = storeWithProject()
      const { abId, bodyId } = getBody(store)
      store.getState().addElement(abId, 'div', bodyId)
      const divId = store.getState().selectedElementId!
      store.getState().updateElement(abId, divId, { name: 'Hero Section' })
      const el = store.getState().project!.artboards[abId].elements[divId]
      expect(el.className).toBe('hero-section')
    })

    it('updates styles on desktop', () => {
      const store = storeWithProject()
      const { abId, bodyId } = getBody(store)
      store.getState().addElement(abId, 'div', bodyId)
      const divId = store.getState().selectedElementId!
      store.getState().updateElement(abId, divId, { styles: { width: '300px' } })
      expect(store.getState().project!.artboards[abId].elements[divId].styles.width).toBe('300px')
    })

    it('does not change body className', () => {
      const store = storeWithProject()
      const { abId, bodyId } = getBody(store)
      store.getState().updateElement(abId, bodyId, { name: 'Something' })
      expect(store.getState().project!.artboards[abId].elements[bodyId].className).toBe('body')
    })
  })

  describe('deleteElement', () => {
    it('deletes element and removes from parent children', () => {
      const store = storeWithProject()
      const { abId, bodyId } = getBody(store)
      store.getState().addElement(abId, 'div', bodyId)
      const divId = store.getState().selectedElementId!
      store.getState().deleteElement(abId, divId)
      const { ab } = getAb(store)
      expect(ab.elements[divId]).toBeUndefined()
      const body = ab.elements[ab.rootChildren.find(id => ab.elements[id]?.type === 'body')!]
      expect(body.children).not.toContain(divId)
    })

    it('cannot delete body element', () => {
      const store = storeWithProject()
      const { abId, bodyId } = getBody(store)
      store.getState().selectElement(bodyId)
      store.getState().deleteElement(abId, bodyId)
      expect(store.getState().project!.artboards[abId].elements[bodyId]).toBeDefined()
    })

    it('recursively deletes children', () => {
      const store = storeWithProject()
      const { abId, bodyId } = getBody(store)
      store.getState().addElement(abId, 'div', bodyId) // parent div
      const divId = store.getState().selectedElementId!
      store.getState().addElement(abId, 'text', divId) // child text
      const textId = store.getState().selectedElementId!

      store.getState().selectElement(divId)
      store.getState().deleteElement(abId, divId)
      const { ab } = getAb(store)
      expect(ab.elements[divId]).toBeUndefined()
      expect(ab.elements[textId]).toBeUndefined()
    })

    it('clears selection when deleted element was selected', () => {
      const store = storeWithProject()
      const { abId, bodyId } = getBody(store)
      store.getState().addElement(abId, 'div', bodyId)
      const divId = store.getState().selectedElementId!
      store.getState().deleteElement(abId, divId)
      expect(store.getState().selectedElementId).toBeNull()
    })
  })

  describe('toggleElementVisibility', () => {
    it('toggles hidden flag', () => {
      const store = storeWithProject()
      const { abId, bodyId } = getBody(store)
      store.getState().addElement(abId, 'div', bodyId)
      const divId = store.getState().selectedElementId!
      store.getState().toggleElementVisibility(abId, divId)
      expect(store.getState().project!.artboards[abId].elements[divId].hidden).toBe(true)
      store.getState().toggleElementVisibility(abId, divId)
      expect(store.getState().project!.artboards[abId].elements[divId].hidden).toBe(false)
    })

    it('cannot hide body', () => {
      const store = storeWithProject()
      const { abId, bodyId } = getBody(store)
      store.getState().toggleElementVisibility(abId, bodyId)
      expect(store.getState().project!.artboards[abId].elements[bodyId].hidden).toBeFalsy()
    })

    it('deselects element when hiding selected', () => {
      const store = storeWithProject()
      const { abId, bodyId } = getBody(store)
      store.getState().addElement(abId, 'div', bodyId)
      const divId = store.getState().selectedElementId!
      store.getState().toggleElementVisibility(abId, divId)
      expect(store.getState().selectedElementId).toBeNull()
    })
  })

  describe('moveElement', () => {
    it('moves element to a new parent', () => {
      const store = storeWithProject()
      const { abId, bodyId } = getBody(store)
      store.getState().addElement(abId, 'div', bodyId)
      const div1 = store.getState().selectedElementId!
      store.getState().addElement(abId, 'div', bodyId)
      const div2 = store.getState().selectedElementId!
      store.getState().addElement(abId, 'text', div2)
      const textId = store.getState().selectedElementId!

      store.getState().moveElement(abId, textId, div1, 0)
      const { ab } = getAb(store)
      expect(ab.elements[div1].children).toContain(textId)
      expect(ab.elements[div2].children).not.toContain(textId)
    })

    it('rejects move to non-container', () => {
      const store = storeWithProject()
      const { abId, bodyId } = getBody(store)
      store.getState().addElement(abId, 'text', bodyId)
      const textId = store.getState().selectedElementId!
      store.getState().addElement(abId, 'div', bodyId)
      const divId = store.getState().selectedElementId!

      // Try to move div into text (non-container)
      store.getState().moveElement(abId, divId, textId, 0)
      const { ab } = getAb(store)
      expect(ab.elements[textId].children).not.toContain(divId)
    })
  })

  describe('wrapElementsInDiv', () => {
    it('wraps selected elements in a div', () => {
      const store = storeWithProject()
      const { abId, bodyId } = getBody(store)
      store.getState().addElement(abId, 'text', bodyId)
      const t1 = store.getState().selectedElementId!
      store.getState().addElement(abId, 'text', bodyId)
      const t2 = store.getState().selectedElementId!

      store.getState().wrapElementsInDiv(abId, [t1, t2])
      const { ab } = getAb(store)
      const body = ab.elements[ab.rootChildren.find(id => ab.elements[id]?.type === 'body')!]
      expect(body.children.length).toBe(1) // one div wrapper
      const wrapper = ab.elements[body.children[0]]
      expect(wrapper.type).toBe('div')
      expect(wrapper.children).toContain(t1)
      expect(wrapper.children).toContain(t2)
    })

    it('selects the wrapper div after wrapping', () => {
      const store = storeWithProject()
      const { abId, bodyId } = getBody(store)
      store.getState().addElement(abId, 'text', bodyId)
      const t1 = store.getState().selectedElementId!
      store.getState().wrapElementsInDiv(abId, [t1])
      const s = store.getState()
      const { ab } = getAb(store)
      expect(ab.elements[s.selectedElementId!].type).toBe('div')
    })
  })

  describe('renameElements', () => {
    it('renames multiple elements', () => {
      const store = storeWithProject()
      const { abId, bodyId } = getBody(store)
      store.getState().addElement(abId, 'text', bodyId)
      const t1 = store.getState().selectedElementId!
      store.getState().addElement(abId, 'text', bodyId)
      const t2 = store.getState().selectedElementId!

      store.getState().renameElements(abId, [
        { id: t1, name: 'Title' },
        { id: t2, name: 'Subtitle' },
      ])
      const { ab } = getAb(store)
      expect(ab.elements[t1].name).toBe('Title')
      expect(ab.elements[t2].name).toBe('Subtitle')
      expect(ab.elements[t1].className).toBe('title')
      expect(ab.elements[t2].className).toBe('subtitle')
    })

    it('skips body renaming', () => {
      const store = storeWithProject()
      const { abId, bodyId } = getBody(store)
      store.getState().renameElements(abId, [{ id: bodyId, name: 'Custom' }])
      expect(store.getState().project!.artboards[abId].elements[bodyId].name).toBe('Body')
    })
  })

  describe('duplicateElement', () => {
    it('creates a copy of selected element', () => {
      const store = storeWithProject()
      const { abId, bodyId } = getBody(store)
      store.getState().addElement(abId, 'div', bodyId)
      const divId = store.getState().selectedElementId!
      store.getState().duplicateElement()
      const s = store.getState()
      expect(s.selectedElementId).not.toBe(divId)
      expect(s.selectedElementId).toBeTruthy()
      const { ab } = getAb(store)
      const body = ab.elements[ab.rootChildren.find(id => ab.elements[id]?.type === 'body')!]
      expect(body.children.length).toBe(2) // original + copy
    })

    it('cannot duplicate body', () => {
      const store = storeWithProject()
      const { bodyId } = getBody(store)
      store.getState().selectElement(bodyId)
      const histBefore = store.getState().history.length
      store.getState().duplicateElement()
      expect(store.getState().history.length).toBe(histBefore)
    })

    it('duplicates with children', () => {
      const store = storeWithProject()
      const { abId, bodyId } = getBody(store)
      store.getState().addElement(abId, 'div', bodyId)
      const divId = store.getState().selectedElementId!
      store.getState().addElement(abId, 'text', divId)

      store.getState().selectElement(divId)
      store.getState().duplicateElement()
      const { ab } = getAb(store)
      const copyId = store.getState().selectedElementId!
      expect(ab.elements[copyId].children.length).toBe(1)
      const childId = ab.elements[copyId].children[0]
      expect(ab.elements[childId]).toBeDefined()
    })
  })

  describe('copyElement / pasteElement', () => {
    it('copy then paste creates new element', () => {
      const store = storeWithProject()
      const { abId, bodyId } = getBody(store)
      store.getState().addElement(abId, 'text', bodyId)
      const textId = store.getState().selectedElementId!
      store.getState().copyElement()
      store.getState().selectElement(null) // deselect
      store.getState().pasteElement()
      const { ab } = getAb(store)
      const body = ab.elements[ab.rootChildren.find(id => ab.elements[id]?.type === 'body')!]
      expect(body.children.length).toBe(2)
      expect(store.getState().selectedElementId).not.toBe(textId)
    })
  })
})

// ===========================
// HistorySlice
// ===========================
describe('HistorySlice', () => {
  it('undo restores previous state', () => {
    const store = storeWithProject()
    const { abId, bodyId } = getBody(store)
    store.getState().addElement(abId, 'div', bodyId)
    store.getState().undo()
    const { ab } = getAb(store)
    const body = ab.elements[ab.rootChildren.find(id => ab.elements[id]?.type === 'body')!]
    expect(body.children.length).toBe(0)
  })

  it('redo after undo restores action', () => {
    const store = storeWithProject()
    const { abId, bodyId } = getBody(store)
    store.getState().addElement(abId, 'div', bodyId)
    store.getState().undo()
    store.getState().redo()
    const { ab } = getAb(store)
    const body = ab.elements[ab.rootChildren.find(id => ab.elements[id]?.type === 'body')!]
    expect(body.children.length).toBe(1)
  })

  it('undo clears selection', () => {
    const store = storeWithProject()
    const { abId, bodyId } = getBody(store)
    store.getState().addElement(abId, 'div', bodyId)
    expect(store.getState().selectedElementId).toBeTruthy()
    store.getState().undo()
    expect(store.getState().selectedElementId).toBeNull()
  })

  it('undo does nothing when no history', () => {
    const store = storeWithProject()
    const projectBefore = store.getState().project
    store.getState().undo()
    expect(store.getState().project).toBe(projectBefore)
  })

  it('redo does nothing when no future', () => {
    const store = storeWithProject()
    const projectBefore = store.getState().project
    store.getState().redo()
    expect(store.getState().project).toBe(projectBefore)
  })

  it('action after undo clears future (redo stack)', () => {
    const store = storeWithProject()
    const { abId, bodyId } = getBody(store)
    store.getState().addElement(abId, 'div', bodyId) // action 1
    store.getState().undo()
    expect(store.getState().future.length).toBeGreaterThan(0)
    store.getState().addElement(abId, 'text', bodyId) // new action
    expect(store.getState().future).toEqual([])
  })

  it('multiple undo/redo cycle', () => {
    const store = storeWithProject()
    const { abId, bodyId } = getBody(store)
    store.getState().addElement(abId, 'div', bodyId)
    store.getState().addElement(abId, 'text', bodyId)

    store.getState().undo()
    store.getState().undo()
    const { ab: ab0 } = getAb(store)
    const body0 = ab0.elements[ab0.rootChildren.find(id => ab0.elements[id]?.type === 'body')!]
    expect(body0.children.length).toBe(0)

    store.getState().redo()
    store.getState().redo()
    const { ab: ab2 } = getAb(store)
    const body2 = ab2.elements[ab2.rootChildren.find(id => ab2.elements[id]?.type === 'body')!]
    expect(body2.children.length).toBe(2)
  })

  it('history overflow caps at 50', () => {
    const store = storeWithProject()
    const { abId, bodyId } = getBody(store)
    for (let i = 0; i < 55; i++) {
      store.getState().addElement(abId, 'text', bodyId)
    }
    expect(store.getState().history.length).toBeLessThanOrEqual(50)
  })

  function getBody(store: TestStore) {
    const s = store.getState()
    const abId = s.activeArtboardId!
    const ab = s.project!.artboards[abId]
    const bodyId = ab.rootChildren.find(id => ab.elements[id]?.type === 'body')!
    return { abId, bodyId }
  }

  function getAb(store: TestStore) {
    const s = store.getState()
    const abId = s.activeArtboardId!
    const ab = s.project!.artboards[abId]
    return { abId, ab }
  }
})

// ===========================
// UiSlice
// ===========================
describe('UiSlice', () => {
  it('setActiveBreakpoint changes breakpoint', () => {
    const store = createTestStore()
    store.getState().setActiveBreakpoint('tablet')
    expect(store.getState().activeBreakpointId).toBe('tablet')
  })

  it('expandLayers adds layer ids', () => {
    const store = createTestStore()
    store.getState().expandLayers(['a', 'b'])
    expect(store.getState().expandedLayers.has('a')).toBe(true)
    expect(store.getState().expandedLayers.has('b')).toBe(true)
  })

  it('collapseLayers removes layer ids', () => {
    const store = createTestStore()
    store.getState().expandLayers(['a', 'b', 'c'])
    store.getState().collapseLayers(['b'])
    expect(store.getState().expandedLayers.has('a')).toBe(true)
    expect(store.getState().expandedLayers.has('b')).toBe(false)
  })

  it('collapseAllLayers clears expanded set', () => {
    const store = createTestStore()
    store.getState().expandLayers(['a', 'b'])
    store.getState().collapseAllLayers()
    expect(store.getState().expandedLayers.size).toBe(0)
  })

  it('setGridEditElementId sets value', () => {
    const store = createTestStore()
    store.getState().setGridEditElementId('el1')
    expect(store.getState().gridEditElementId).toBe('el1')
    store.getState().setGridEditElementId(null)
    expect(store.getState().gridEditElementId).toBeNull()
  })
})
