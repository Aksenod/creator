import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AIChatState, ChatMessage } from '../components/AIChat/types'

const MAX_MESSAGES = 100

export const DEFAULT_CUSTOM_PROMPT = `## Design Thinking

Before building, understand the context and commit to a BOLD aesthetic direction:

- Purpose: What problem does this interface solve? Who uses it?
- Tone: Pick a flavor — brutally minimal, maximalist, retro-futuristic, organic/natural, luxury/refined, playful, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian — or invent your own.
- Differentiation: What makes this layout MEMORABLE? Commit to one bold choice.

Execute the chosen direction with precision. Bold maximalism and refined minimalism both work — the key is intentionality.

## Aesthetics Guidelines

- Typography: Choose distinctive fontFamily values (e.g. "Georgia", "Courier New", "Trebuchet MS", "Palatino", "Garamond"). Avoid generic Arial/Inter/sans-serif defaults. Pair display and body fonts intentionally.
- Color & Theme: Commit to a cohesive palette. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Use backgroundColor and color purposefully. Vary between light and dark themes.
- Spatial Composition: Embrace asymmetry, generous negative space, or controlled density. Use gap, padding, and margin to create rhythm. Grid-breaking layouts with gridColumn/gridRow create visual interest.
- Visual Details: Add depth with borderRadius, borderWidth/borderColor, opacity layers, overlapping elements via position absolute/relative.

NEVER create generic-looking interfaces: avoid cliched grey-on-white layouts, predictable uniform grids, cookie-cutter spacing. Every design should feel intentionally crafted for its context.

If the request is ambiguous, make a bold creative decision rather than asking for clarification. Designers appreciate opinionated choices they can refine.`

export const useAIChatStore = create<AIChatState>()(
  persist(
    (set) => ({
      messages: [],
      isStreaming: false,
      error: null,
      settings: {
        apiKey: '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',
        model: 'moonshotai/kimi-k2-thinking',
        temperature: 0.4,
        customPrompt: DEFAULT_CUSTOM_PROMPT,
      },

      addMessage: (msg: ChatMessage) =>
        set((s) => ({
          messages: [...s.messages, msg].slice(-MAX_MESSAGES),
        })),

      setMessages: (msgs: ChatMessage[]) =>
        set({ messages: msgs.slice(-MAX_MESSAGES) }),

      updateLastAssistant: (content, toolCalls) =>
        set((s) => {
          const msgs = [...s.messages]
          const last = msgs[msgs.length - 1]
          if (last?.role === 'assistant') {
            msgs[msgs.length - 1] = {
              ...last,
              content,
              ...(toolCalls ? { tool_calls: toolCalls } : {}),
            }
          }
          return { messages: msgs }
        }),

      setStreaming: (v) => set({ isStreaming: v }),
      setError: (e) => set({ error: e }),

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: 'creator-ai-chat',
      partialize: (state) => ({
        messages: state.messages,
        settings: { model: state.settings.model, temperature: state.settings.temperature, customPrompt: state.settings.customPrompt },
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<AIChatState> | undefined
        const merged = { ...current, ...p }
        // Always use hardcoded apiKey from defaults
        merged.settings = { ...current.settings, ...p?.settings, apiKey: current.settings.apiKey }
        if (!merged.settings.customPrompt) {
          merged.settings.customPrompt = DEFAULT_CUSTOM_PROMPT
        }
        return merged as AIChatState
      },
    },
  ),
)
