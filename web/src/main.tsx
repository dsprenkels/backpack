import React, { Context, Dispatch, SetStateAction, useEffect, useState } from 'react';
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
  const [appStore, setAppStore] = useState<Store>(() => {
    let store = loadStore()
    if (store.revision == 0) {
      // This is the first version
      store.bringListTemplate = DEFAULT_BRINGLIST_TEMPLATE
      // Set default nights to 3
      store.nights = 3
    }
    return store
  })
  useEffect(() => saveStore(appStore), [appStore])

  return <React.StrictMode>
    <AppStateContext.Provider value={appStore}>
      <SetAppStateContext.Provider value={(store) => {
        store = structuredClone(store)
        store.revision++
        store.updatedAt = new Date()
        setAppStore(store)
      }}>
        <RouterProvider router={router} />
      </SetAppStateContext.Provider>
    </AppStateContext.Provider>
  </React.StrictMode>
    ;
};

root.render(<App />);