const routes = [
  {
    path: "/",
    name: "main",
    component: () => import("@/views/main/index.vue"),
    redirect: "/dashboard",
    children: [
      {
        path: "/dashboard",
        name: "dashboard",
        component: () => import("@/views/main/dashboard/index.vue"),
      },
      {
        path: "/dashboard/collections",
        name: "collections",
        component: () => import("@/views/main/collections/index.vue"),
      },
      {
        path: "/dashboard/explore",
        name: "explore",
        component: () => import("@/views/main/explore/index.vue"),
      },
    ],
  },
  {
    path: "/login",
    name: "login",
    component: () => import("@/views/auth/login/index.vue"),
  },
  {
    path: "/register",
    name: "register",
    component: () => import("@/views/auth/register/index.vue"),
  },
  {
    path: "/resetPassword",
    name: "resetPassword",
    component: () => import("@/views/auth/resetPassword/index.vue"),
  },
  {
    path: "/editor",
    name: "editor",
    component: () => import("@/views/editor/index.vue"),
  },
  {
    path: "/article",
    name: "article",
    component: () => import("@/views/article/index.vue"),
  },
]

export default routes
