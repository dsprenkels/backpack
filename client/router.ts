import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import BringListView from './BringListView.vue'
import ErrorPage from './ErrorPage.vue'

const routes: RouteRecordRaw[] = [
    { path: '/view', alias: '/', component: BringListView },
    { path: '/edit', component: () => import('./BringListEdit.vue') },
    { path: '/:pathMatch(.*)*', component: ErrorPage },
]

export const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
})
