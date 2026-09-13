// @vitest-environment jsdom
import { beforeEach, expect, test, vi } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import BringListView from './BringListView.vue'
import { useBringListStore } from './store'

vi.mock('./trpc', () => ({
    trpc: { hello: { query: vi.fn().mockResolvedValue({ message: 'Hello test!' }) } },
}))

const STORAGE_KEY = 'com.electricdusk.backpack.v1.state'

beforeEach(() => {
    localStorage.clear()
})

function mountView() {
    const pinia = createPinia()
    setActivePinia(pinia)
    const wrapper = mount(BringListView, {
        global: {
            plugins: [pinia],
            stubs: { RouterLink: RouterLinkStub },
        },
    })
    return { wrapper, store: useBringListStore() }
}

test('renders a category from the default template', () => {
    const { wrapper } = mountView()
    // "Toiletspullen" has no tag expression, so it is always visible
    expect(wrapper.text()).toContain('Toiletspullen')
})

test('clicking a tag toggles it in the store and reveals its category', async () => {
    const { wrapper, store } = mountView()
    expect(wrapper.text()).not.toContain('Kampeerspullen')

    const chip = wrapper.findAll('li').find(li => li.text() === 'kamperen')
    expect(chip).toBeDefined()
    await chip!.trigger('click')

    expect(store.bringList.tags).toEqual(['kamperen'])
    expect(wrapper.text()).toContain('Kampeerspullen')

    // The persistence watcher runs before the next render, which trigger() awaited
    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(persisted.bringList.tags).toEqual(['kamperen'])
})

test('loads a pre-migration state blob unchanged', () => {
    const stored = {
        bringList: { bringListTemplate: '# Foo\nbar', tags: ['x'], checked: ['bar'], nights: 5, header: 'trip' },
        helloMessage: null,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    const { wrapper, store } = mountView()
    expect(store.bringList).toEqual(stored.bringList)
    expect(wrapper.text()).toContain('Foo')
})
