import React from "react"

interface ButtonProps {
  children: React.ReactNode, 
  onClick: ()=> void
}


export const ButtonPrimary = function({children, onClick}: ButtonProps){
  return(
    <div className="flex justify-center items-center bg-primary-800 h-auto w-auto px-6 py-2 text-white font-mono font-medium text-lg rounded-[4px] cursor-pointer" onClick={onClick}>{children}</div>
  )
}