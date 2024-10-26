import React, { Context, Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter, RouteObject,
  RouterProvider
} from "react-router-dom";
import BringListEdit from './BringListEdit';
import BringListView from './BringListView';
import { ErrorPage } from './ErrorPage';
import './index.css';
import { Store, loadStore, saveStore } from './store';
import DEFAULT_BRINGLIST_TEMPLATE from './template';

export const AppStateContext = React.createContext<Store | null>(null)
export const SetAppStateContext = React.createContext<((store: Store) => void) | null>(null)


const routes: RouteObject[] = [
  { path: '/', element: <BringListView />, errorElement: <ErrorPage /> },
  { path: '/view', element: <BringListView /> },
  { path: '/edit', element: <BringListEdit /> },
]

const router = createBrowserRouter(routes,
  { basename: import.meta.env.BASE_URL },
)

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

function App() {
  const [userStore, setUserStore] = useState<Store | null>(null)
  useEffect(() => {
    loadStore().then(store => {
      if (store.revision === 0) {
        // This is the first version
        store.bringListTemplate = DEFAULT_BRINGLIST_TEMPLATE
        // Set default nights to 3
        store.nights = 3
      }
      console.debug('Loaded store', store)
      setUserStore(store)
    })
  }, [])
  useEffect(() => {
    if (userStore !== null) {
      saveStore(userStore)
    }
  }, [userStore])

  console.debug("Current store:", userStore)

  return <React.StrictMode>
    <AppStateContext.Provider value={userStore}>
      <SetAppStateContext.Provider value={(store) => {
        store = structuredClone(store)
        store.revision++
        store.updatedAt = new Date()
        setUserStore(store)
      }}>
        <RouterProvider router={router} />
      </SetAppStateContext.Provider>
    </AppStateContext.Provider>
  </React.StrictMode>
    ;
};

root.render(<App />);