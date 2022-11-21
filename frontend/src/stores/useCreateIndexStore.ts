import create from 'zustand'

type CreateIndexTxnArgs = {
  tokens: string[]
  pool_ids: number[]
  metadata: {
    spec: string
    name: string
    symbol: string
    icon: string
    decimals: number
  }
}

interface CreateIndexState {
  args: CreateIndexTxnArgs
  setName: (name: string) => void
  setSymbol: (sym: string) => void
  addToken: () => void
  removeToken: (token: string) => void
  updateToken: (token: string, idx: number) => void
  updatePoolId: (id: number, idx: number) => void
}

export const useCreateIndexStore = create<CreateIndexState>((set) => ({
  args: {
    tokens: [],
    pool_ids: [],
    metadata: {
      spec: 'ft-1.0.0',
      name: '',
      symbol: '',
      icon: '',
      decimals: 24,
    },
  },
  setName(name) {
    set((state) => ({
      args: {
        ...state.args,
        metadata: {
          ...state.args.metadata,
          name: name,
        },
      },
    }))
  },
  setSymbol(sym) {
    set((state) => ({
      args: {
        ...state.args,
        metadata: {
          ...state.args.metadata,
          symbol: sym,
        },
      },
    }))
  },
  addToken() {
    set((state) => ({
      args: {
        ...state.args,
        tokens: [...state.args.tokens, ''],
        pool_ids: [...state.args.pool_ids, -1],
      },
    }))
  },
  removeToken(token) {
    set((state) => {
      const idx = state.args.tokens.findIndex((x) => x === token)
      const newTokens = [...state.args.tokens]
      newTokens.splice(idx, 1)
      const newPoolIds = [...state.args.pool_ids]
      newPoolIds.splice(idx, 1)
      return {
        args: {
          ...state.args,
          tokens: newTokens,
          pool_ids: newPoolIds,
        },
      }
    })
  },
  updateToken(token, idx) {
    set((state) => {
      const newTokens = [...state.args.tokens]
      newTokens[idx] = token
      return {
        args: {
          ...state.args,
          tokens: newTokens,
        },
      }
    })
  },
  updatePoolId(id, idx) {
    set((state) => {
      const newPoolIds = [...state.args.pool_ids]
      newPoolIds[idx] = id
      return {
        args: {
          ...state.args,
          pool_ids: newPoolIds,
        },
      }
    })
  },
}))
