import { createContext, useState } from "react";

const SideBarContext = createContext()

const SideBarProvider = ({children})=>{
    const [isOpen , setIsOpen] = useState(false)
    const [isShopCartOpen, setisShopCartOpen] = useState(false)
    const [isNavMobileOpen , setIsNavMobileOpen] = useState(false)
    const values = {
        isOpen, setIsOpen,isShopCartOpen,setisShopCartOpen,
        isNavMobileOpen, setIsNavMobileOpen

    }
    return (
        <SideBarContext.Provider value={values}>
            {children}
        </SideBarContext.Provider>
    )
}
export {
    SideBarContext , SideBarProvider
}