import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import AdminLoginForm from './form'

export default async function AdminLoginPage() {
  // If already logged in, redirect to dashboard
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/admin')
  }

  return <AdminLoginForm />
}
