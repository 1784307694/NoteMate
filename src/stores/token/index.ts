import { defineStore } from "pinia"
import { lStorage } from "@/utils/storage"

const useTokenStore = defineStore("token", {
  state: () => ({
    token: lStorage.get("ACCESS_TOKEN") || "",
  }),
  actions: {
    setToken(token: string) {
      this.token = token
      lStorage.set("ACCESS_TOKEN", token)
    },
    clearToken() {
      this.token = ""
      lStorage.remove("ACCESS_TOKEN")
    },
  },
})

export default useTokenStore
