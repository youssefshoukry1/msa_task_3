"use client"
import { usePathname } from 'next/navigation'
import React from 'react'

export default function Footer() {
  const pathname = usePathname();
  // The home page renders its own Mowix footer
  if (pathname === "/") return null;
  return (
    <footer className=''>

    </footer>
  )
}
