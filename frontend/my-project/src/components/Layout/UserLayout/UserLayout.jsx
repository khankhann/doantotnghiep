import Header from "@components/Common/Header";
import Footer from "@components/Common/Footer";
import { Outlet } from "react-router-dom";

function UserLayout() {
    return (  
        <div>
            <Header />
            <main>
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}

export default UserLayout;