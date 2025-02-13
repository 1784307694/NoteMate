import { defineStore } from "pinia"
import api from "@/apis"
import useTokenStore from "@/stores/token"

type UserInfo = {
  id: string
  username: string
  email: string
  phone: string
  avatar: string
  roles: number[]
  is_superuser: boolean
  is_active: boolean
}

export const useUserStore = defineStore("user", {
  state() {
    return {
      userInfo: {} as UserInfo,
    }
  },
  getters: {
    userId(state) {
      return state.userInfo?.id
    },
    username(state) {
      return state.userInfo?.username
    },
    email(state) {
      return state.userInfo?.email
    },
    phone(state) {
      return state.userInfo?.phone
    },
    avatar(state) {
      return (
        state.userInfo?.avatar ||
        "https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"
      )
    },
    role(state) {
      return state.userInfo?.roles || []
    },
    isSuperUser(state) {
      return state.userInfo?.is_superuser
    },
    isActive(state) {
      return state.userInfo?.is_active
    },
  },
  actions: {
    async getUserInfo() {
      try {
        const res = await api.base.getUserInfo()
        const { id, username, email, phone, avatar, roles, is_superuser, is_active } = res.data
        this.userInfo = { id, username, email, phone, avatar, roles, is_superuser, is_active }
        return res.data
      } catch (error) {
        this.logout()
        return error
      }
    },

    async logout() {
      try {
        // 重置用户信息
        this.userInfo = {} as UserInfo
        // 清除登陆逻辑
        useTokenStore().clearToken()
      } catch (error) {
        console.error("退出登录时发生错误:", error)
      }
    },
    setUserInfo(userInfo: UserInfo) {
      this.userInfo = { ...this.userInfo, ...userInfo }
    },
  },
})

export default useUserStore
