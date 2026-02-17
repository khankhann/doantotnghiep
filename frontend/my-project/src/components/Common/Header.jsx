import TopBar from "@components/Common/TopBar/TopBar";
import Navbar from "@components/Common/NavBar/NavBar";
import { SideBarProvider } from "@context/SideBarContext.jsx";
function Header() {
  return (
    <SideBarProvider>
      <header className=" border-b border-gray-300 ">
        {/* {top bar} */}
        <TopBar />
        {/* {nav bar } */}
        <Navbar />
      </header>

      {/* {cart } */}
    </SideBarProvider>
  );
}

export default Header;
