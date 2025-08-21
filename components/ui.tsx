
'use client'
import { clsx } from 'clsx'

export function Button({ className, ...props }: any) {
  return <button className={clsx('px-4 py-2 rounded-xl bg-[var(--brand)] text-white disabled:opacity-50', className)} {...props} />
}

export function Card({ className, ...props }: any) {
  return <div className={clsx('rounded-2xl border border-white/10 bg-white/5 p-4', className)} {...props} />
}
