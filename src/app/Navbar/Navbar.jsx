"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'
export default function Navbar() {
  const pathname = usePathname();
  console.log(pathname)
  // The home page renders its own Mowix header
  if (pathname === "/") return null;
  return (
    <nav className=' h-10 bg-gray-500'>

    </nav>
  )
}
