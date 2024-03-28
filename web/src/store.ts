import { Action, ThunkAction, configureStore } from '@reduxjs/toolkit';
import bringListReducer, { localStorageMiddleware } from "./bringlistSlice";
import userReducer from "./userSlice";

export const store = configureStore({
    reducer: {
        user: userReducer,
        bringlist: bringListReducer,
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().prepend(localStorageMiddleware)
})

export type AppStore = typeof store
export type AppState = ReturnType<AppStore["getState"]>
export type AppDispatch = AppStore["dispatch"]
export type AppThunk<ThunkReturnType = void> = ThunkAction<
    ThunkReturnType,
    AppState,
    unknown,
    Action
>