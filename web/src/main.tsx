import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import {
  RouteObject,
  RouterProvider,
  createBrowserRouter
} from "react-router-dom";
import BringListEdit from './BringListEdit';
import BringListView from './BringListView';
import { ErrorPage } from './ErrorPage';
import './index.css';
import { store } from './store';

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
  return <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>
    ;
};

root.render(<App />);