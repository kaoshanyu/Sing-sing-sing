"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Smartphone, MessageCircle, Mail, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LoginScreenProps {
  onLogin: (email: string, password: string) => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleEmailLogin = async () => {
    if (!email || !password) {
      setError("请输入邮箱和密码")
      return
    }
    setIsLoading(true)
    setError("")
    try {
      await onLogin(email, password)
    } catch (e: any) {
      setError(e.message || "登录失败")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FDF8F3] flex flex-col items-center justify-center px-8">
      {/* Logo 和品牌名 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center mb-10"
      >
        {/* Logo */}
        <div className="w-28 h-28 rounded-[32px] bg-gradient-to-br from-[#E8B4A0] to-[#D4A088] flex items-center justify-center mb-6 shadow-lg">
          <svg viewBox="0 0 80 80" className="w-16 h-16 text-white">
            <circle cx="25" cy="55" r="10" fill="currentColor" />
            <circle cx="55" cy="45" r="10" fill="currentColor" />
            <rect x="33" y="15" width="4" height="42" fill="currentColor" rx="2" />
            <rect x="63" y="10" width="4" height="37" fill="currentColor" rx="2" />
            <path d="M35 15 Q49 5 65 10" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-[#4A3728] mb-2">五音不全</h1>
        <p className="text-[#8B7355] text-center text-balance">
          专为你设计的AI智能音乐教学
        </p>
      </motion.div>

      {/* 登录表单 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full max-w-sm space-y-4"
      >
        {/* 邮箱 */}
        <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-[#E8DDD5]">
          <Mail className="w-5 h-5 text-[#8B7355]" />
          <input
            type="email"
            placeholder="邮箱"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[#4A3728] outline-none placeholder:text-[#8B7355]"
          />
        </div>

        {/* 密码 */}
        <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-[#E8DDD5]">
          <Lock className="w-5 h-5 text-[#8B7355]" />
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleEmailLogin()}
            className="flex-1 bg-transparent text-sm text-[#4A3728] outline-none placeholder:text-[#8B7355]"
          />
        </div>

        {error && <p className="text-red-500 text-xs text-center">{error}</p>}

        {/* 登录按钮 */}
        <Button
          onClick={handleEmailLogin}
          disabled={isLoading}
          className="w-full h-14 rounded-2xl bg-[#E8B4A0] hover:bg-[#D4A088] text-white font-medium text-base shadow-md"
        >
          {isLoading ? "登录中..." : "登录 / 注册"}
        </Button>

        {/* 分隔线 */}
        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 h-px bg-[#E8DDD5]" />
          <span className="text-sm text-[#8B7355]">或使用社交账号</span>
          <div className="flex-1 h-px bg-[#E8DDD5]" />
        </div>

        {/* 社交登录按钮 */}
        <div className="flex justify-center gap-6">
          <button className="w-14 h-14 rounded-full bg-[#07C160] flex items-center justify-center shadow-md hover:opacity-90 transition-opacity">
            <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="currentColor">
              <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z" />
            </svg>
          </button>

          <button className="w-14 h-14 rounded-full bg-[#12B7F5] flex items-center justify-center shadow-md hover:opacity-90 transition-opacity">
            <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="currentColor">
              <path d="M12.003 2c-2.265 0-6.29 1.364-6.29 7.325v1.195S3.55 14.96 3.55 17.474c0 .665.17 1.025.281 1.025.114 0 .902-.484 1.748-2.072 0 0-.18 2.197 1.904 3.967 0 0-1.77.495-1.77 1.182 0 .686 4.078.43 6.29.43 2.213 0 6.291.256 6.291-.43 0-.687-1.77-1.182-1.77-1.182 2.085-1.77 1.904-3.967 1.904-3.967.846 1.588 1.634 2.072 1.748 2.072.111 0 .281-.36.281-1.025 0-2.514-2.163-6.954-2.163-6.954V9.325C18.294 3.364 14.269 2 12.003 2z" />
            </svg>
          </button>

          <button className="w-14 h-14 rounded-full bg-[#A8D5BA] flex items-center justify-center shadow-md hover:opacity-90 transition-opacity">
            <MessageCircle className="w-7 h-7 text-white" />
          </button>
        </div>
      </motion.div>

      {/* 用户协议 */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-xs text-[#8B7355] text-center mt-10 px-8"
      >
        登录即表示同意
        <button className="text-[#E8B4A0] mx-1">用户协议</button>
        和
        <button className="text-[#E8B4A0] mx-1">隐私政策</button>
      </motion.p>
    </div>
  )
}
