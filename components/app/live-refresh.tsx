'use client'
import {useEffect} from 'react'
import {useRouter} from 'next/navigation'

export function LiveRefresh() {
  const router=useRouter()
  useEffect(()=>{
    const refresh=()=>{
      const editing=['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName??'')||document.querySelector('[data-dirty="true"], [role="dialog"][data-state="open"]')
      if(document.visibilityState==='visible'&&!editing)router.refresh()
    }
    const timer=setInterval(refresh,15000)
    window.addEventListener('focus',refresh)
    return ()=>{clearInterval(timer);window.removeEventListener('focus',refresh)}
  },[router])
  return null
}
