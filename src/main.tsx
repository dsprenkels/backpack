import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import BringListView from './BringListView';
import BringListEdit from './BringListEdit';
import {
  createBrowserRouter,
  RouterProvider,
  Route,
} from "react-router-dom";

const routes = [
  { path: '/', element: <BringListView /> },
  { path: '/edit', element: <BringListEdit /> },
]

const router = createBrowserRouter(routes,
  { basename: import.meta.env.BASE_URL },
)

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

