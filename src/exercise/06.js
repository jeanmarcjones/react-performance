// Fix "perf death by a thousand cuts"
// http://localhost:3000/isolated/exercise/06.js

import * as React from 'react'
import {
  useForceRerender,
  useDebouncedState,
  AppGrid,
  updateGridState,
  updateGridCellState,
} from '../utils'

const DogStateProvider = React.createContext()

function dogReducer(state, action) {
  switch (action.type) {
    case 'TYPED_IN_DOG_INPUT': {
      return {...state, dogName: action.dogName}
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`)
    }
  }
}

function DogProvider({children}) {
  const [state, dispatch] = React.useReducer(dogReducer, {
    dogName: '',
  })
  const value = [state, dispatch]
  return (
    <DogStateProvider.Provider value={value}>
      {children}
    </DogStateProvider.Provider>
  )
}

function useDogState() {
  const context = React.useContext(DogStateProvider)
  if (!context) {
    throw new Error('useDogState must be used within the DogProvider')
  }
  return context
}

const AppStateContext = React.createContext()
const AppDispatchContext = React.createContext()

const initialGrid = Array.from({length: 100}, () =>
  Array.from({length: 100}, () => Math.random() * 100),
)

function gridReducer(state, action) {
  switch (action.type) {
    case 'UPDATE_GRID_CELL': {
      return {...state, grid: updateGridCellState(state.grid, action)}
    }
    case 'UPDATE_GRID': {
      return {...state, grid: updateGridState(state.grid)}
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`)
    }
  }
}

function GridProvider({children}) {
  const [state, dispatch] = React.useReducer(gridReducer, {
    grid: initialGrid,
  })
  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  )
}

function useGridState() {
  const context = React.useContext(AppStateContext)
  if (!context) {
    throw new Error('useGridState must be used within the GridProvider')
  }
  return context
}

function useGridDispatch() {
  const context = React.useContext(AppDispatchContext)
  if (!context) {
    throw new Error('useGridDispatch must be used within the GridProvider')
  }
  return context
}

function Grid() {
  const dispatch = useGridDispatch()
  const [rows, setRows] = useDebouncedState(50)
  const [columns, setColumns] = useDebouncedState(50)
  const updateGridData = () => dispatch({type: 'UPDATE_GRID'})
  return (
    <AppGrid
      onUpdateGrid={updateGridData}
      rows={rows}
      handleRowsChange={setRows}
      columns={columns}
      handleColumnsChange={setColumns}
      Cell={Cell}
    />
  )
}

Grid = React.memo(Grid)

function withStateSlice(Comp, slice) {
  const MemoComp = React.memo(Comp)
  function Wrapper(props, ref) {
    const state = useGridState()
    return <MemoComp ref={ref} state={slice(props, state)} {...props} />
  }
  Wrapper.displayName = `withStateSlice(${Comp.displayName || Comp.name})`
  return React.memo(React.forwardRef(Wrapper))
}

function Cell({row, column, state: cell}) {
  const dispatch = useGridDispatch()
  const handleClick = () => dispatch({type: 'UPDATE_GRID_CELL', row, column})

  return (
    <button
      className="cell"
      onClick={handleClick}
      style={{
        color: cell > 50 ? 'white' : 'black',
        backgroundColor: `rgba(0, 0, 0, ${cell / 100})`,
      }}
    >
      {Math.floor(cell)}
    </button>
  )
}

Cell = withStateSlice(Cell, ({row, column}, state) => state.grid[row][column])

function DogNameInput() {
  const [state, dispatch] = useDogState()
  const {dogName} = state

  function handleChange(event) {
    const newDogName = event.target.value
    dispatch({type: 'TYPED_IN_DOG_INPUT', dogName: newDogName})
  }

  return (
    <form onSubmit={e => e.preventDefault()}>
      <label htmlFor="dogName">Dog Name</label>
      <input
        value={dogName}
        onChange={handleChange}
        id="dogName"
        placeholder="Toto"
      />
      {dogName ? (
        <div>
          <strong>{dogName}</strong>, I've a feeling we're not in Kansas anymore
        </div>
      ) : null}
    </form>
  )
}

function App() {
  const forceRerender = useForceRerender()
  return (
    <div className="grid-app">
      <button onClick={forceRerender}>force rerender</button>
      <div>
        <DogProvider>
          <DogNameInput />
        </DogProvider>
        <GridProvider>
          <Grid />
        </GridProvider>
      </div>
    </div>
  )
}

export default App

/*
eslint
  no-func-assign: 0,
*/
