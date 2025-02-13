interface LoginForm {
  loginType: "sms" | "email" | "username"
  phone?: string
  code?: string
  username?: string
  email?: string
  password?: string
}

interface RegisterForm {
  username: string
  email: string
  code: string
  password: string
  confirmPassword: string
}

export type { LoginForm, RegisterForm }
