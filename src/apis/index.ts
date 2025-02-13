import { request } from "@/utils/http"

const base = {
  login: (data: {
    username?: string
    email?: string
    password?: string
    loginType: "email" | "sms" | "username"
    phone?: string
    code?: string
  }) => request.post("/base/access_token", { ...data, noNeedToken: true }),
  getUserInfo: () => request.get("/base/userinfo"),
  getUserMenu: () => request.get("/base/usermenu"),
  getUserApi: () => request.get("/base/userapi"),

  updatePassword: (data: { email: string; code: string; password: string }) =>
    request.post("/base/update_password", data),
  createUser: (data: {
    phone?: string
    email?: string
    username?: string
    password?: string
    code: string
  }) => request.post("/base/create", data),
  updateBaseUserInfo: (data: { email?: string; phone?: string; username?: string }) =>
    request.post("/base/updateUserInfo", data),
  sendEmailCode: (email: string) => request.get("/base/send_email_code", { params: { email } }),

  // 上传图片
  uploadImage: (file: File) => {
    const formData = new FormData()
    formData.append("file", file)
    return request.post("/base/upload/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
  },
}

const notes = {
  getKnowledgeBasesList: (data: { user_id: string }) =>
    request.get("/notes/knowledge_bases_list", { params: data }),
  // type:0私有, 1 公开
  createKnowledgeBases: (data: { name: string; type: number }) =>
    request.post("/notes/create_knowledge_bases", data),

  updateKnowledgeBases: (data: { id: string; name: string; type: number }) =>
    request.post("/notes/update_knowledge_bases", data),

  deleteKnowledgeBases: (data: { id: string }) =>
    request.delete("/notes/delete_knowledge_bases", { params: data }),

  getKnowledgeBasesNotesList: (data: {
    knowledge_bases_id: number
    page?: number
    page_size?: number
    status?: number
    type?: number
    keyword?: string
  }) => request.get("/notes/knowledge_bases_notes_list", { params: data }),

  getNoteDetail: (data: { note_id: number }) => request.get("/notes/note_detail", { params: data }),

  createNote: (data: {
    knowledge_bases_id: number
    title: string
    cover?: string
    introduction?: string
    type?: number
    price?: number
    status?: number
  }) => request.post("/notes/create_note", data),

  updateNote: (data: {
    id: number
    title: string
    cover?: string
    introduction?: string
    type?: number
    price?: number
    status?: number
  }) => request.post("/notes/update_note", data),

  deleteNote: (data: { note_id: number }) => request.delete("/notes/delete_note", { params: data }),

  updateNoteContent: (data: { note_id: number; content: string }) =>
    request.post("/notes/update_note_content", null, { params: data }),

  // 获取文章列表
  getNotesList: (params: {
    page: number
    page_size: number
    type?: number
    status?: number
    min_price?: number
    max_price?: number
  }) => request.get("/notes/list", { params }),
}

export default {
  base,
  notes,
}
