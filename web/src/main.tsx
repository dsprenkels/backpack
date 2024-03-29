import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider, useDispatch, useSelector } from 'react-redux';
import {
  LoaderFunction,
  RouteObject,
  RouterProvider,
  createBrowserRouter,
  redirect,
  useNavigate
} from "react-router-dom";
import BringListEdit from './BringListEdit';
import BringListView from './BringListView';
import { ErrorPage } from './ErrorPage';
import Login from './Login';
import './index.css';
import { AppDispatch, AppState, store } from './store';
import { fetchUser } from './userSlice';

const routes: RouteObject[] = [
  { path: '/', element: <Index />, errorElement: <ErrorPage /> },
  { path: '/view', element: <BringListView /> },
  { path: '/edit', element: <BringListEdit /> },
  { path: '/login', element: <Login /> },
]

const router = createBrowserRouter(routes,
  { basename: import.meta.env.BASE_URL },
)

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const userStatus = useSelector((state: AppState) => state.user.status)
  useEffect(() => {
    if (userStatus == "uninitialized") {
      dispatch(fetchUser());
    }
  }, [userStatus])

  return <RouterProvider router={router} />
};

function Index() {
  const navigate = useNavigate();
  const user = useSelector((state: AppState) => state.user);
  useEffect(() => {
    if (user === null) {
      navigate('/login');
    } else {
      navigate('/view');
    }
  }, [user])
  return <></>
}

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);