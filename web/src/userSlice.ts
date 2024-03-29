import { SerializedError, createAsyncThunk, createSlice } from "@reduxjs/toolkit"

export interface GitHubUser {
    id?: number,
    githubId?: number,
    githubLogin?: string,
    displayName?: string,
    avatarURL?: string,
    createdAt?: string,
    updatedAt?: string,
}

export type User = GitHubUser

export interface UserState {
    user: User | null,
    error?: SerializedError,
    status: "uninitialized" | "loading" | "succeeded" | "failed",
}

export const fetchUser = createAsyncThunk('fetchUser', async () => {
    const resp = await fetch(import.meta.env.BASE_URL + "api/user")
    return await resp.json() as string
})

const initialState: UserState = {
    user: null,
    status: "uninitialized",
}

export const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {},
    extraReducers(builder) {
        builder.addCase(fetchUser.pending, (state, action) => {
            state.status = "loading"
        })
        builder.addCase(fetchUser.fulfilled, (state, action) => {
            state.status = "succeeded"
            state.user = action.payload as User
        })
        builder.addCase(fetchUser.rejected, (state, action) => {
            state.status = "failed"
            action.error = action.error
        })
    },
})

export default userSlice.reducer
