import {
    useState
} from "react";

import {
    useLocation,
    useNavigate
} from "react-router-dom";

import "./AdminLayout.css";


function AdminLayout({ children }) {

    const navigate =
        useNavigate();


    const location =
        useLocation();


    const [mobileMenuOpen, setMobileMenuOpen] =
        useState(false);


    const isActive = path => {

        return location.pathname === path;

    };


    const handleNavigation = path => {

        navigate(path);

        setMobileMenuOpen(false);

    };


    const handleLogout = () => {

        const confirmed =
            window.confirm(
                "Are you sure you want to log out?"
            );


        if (!confirmed) {
            return;
        }


        localStorage.removeItem(
            "authToken"
        );

        localStorage.removeItem(
            "authUser"
        );


        navigate(
            "/login",
            {
                replace: true
            }
        );

    };


    return (

        <div className="admin-layout">


            {/* SIDEBAR */}

            <aside
                className={`admin-sidebar ${
                    mobileMenuOpen
                        ? "open"
                        : ""
                }`}
            >

                <div className="admin-sidebar-brand">

    <img
        src="/images/ufi-logo.png"
        alt="UFI Filters"
        className="admin-company-logo"
    />


    <div className="admin-sidebar-brand-text">

        <strong>
            Gate Entry
        </strong>

        <span>
            Administration
        </span>

    </div>

</div>


                <nav className="admin-sidebar-navigation">

                    <div className="admin-sidebar-section-title">
                        MANAGEMENT
                    </div>


                    <button
                        type="button"
                        className={
                            isActive(
                                "/admin/dashboard"
                            )
                                ? "active"
                                : ""
                        }
                        onClick={() => {

                            handleNavigation(
                                "/admin/dashboard"
                            );

                        }}
                    >

                        <span className="admin-sidebar-nav-icon">
                            ▦
                        </span>

                        <div>

                            <strong>
                                Visitor Management
                            </strong>

                            <small>
                                Dashboard and records
                            </small>

                        </div>

                    </button>


                    <button
                        type="button"
                        className={
                            isActive(
                                "/admin/employees"
                            )
                                ? "active"
                                : ""
                        }
                        onClick={() => {

                            handleNavigation(
                                "/admin/employees"
                            );

                        }}
                    >

                        <span className="admin-sidebar-nav-icon">
                            👥
                        </span>

                        <div>

                            <strong>
                                Employees & Access
                            </strong>

                            <small>
                                Login account management
                            </small>

                        </div>

                    </button>


                   {/* <div className="admin-sidebar-section-title">
                        SYSTEM
                    </div>


                    <button
                        type="button"
                        disabled
                    >

                        <span className="admin-sidebar-nav-icon">
                            ◷
                        </span>

                        <div>

                            <strong>
                                Audit Logs
                            </strong>

                            <small>
                                Coming later
                            </small>

                        </div>

                    </button> >*/}


                     {/* <button
                        type="button"
                        disabled
                   

                      <span className="admin-sidebar-nav-icon">
                            ⚙
                        </span>

                        <div>

                            <strong>
                                Settings
                            </strong>

                            <small>
                                Coming later
                            </small>

                        </div>

                    </button>*/}

                </nav>


                <div className="admin-sidebar-footer">

                    <div className="admin-sidebar-user">

                        <div className="admin-sidebar-avatar">
                            A
                        </div>

                        <div>

                            <strong>
                                Administrator
                            </strong>

                            <span>
                                System Admin
                            </span>

                        </div>

                    </div>


                    <button
                        type="button"
                        className="admin-sidebar-logout"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>

                </div>

            </aside>


            {/* MOBILE OVERLAY */}

            {mobileMenuOpen && (

                <div
                    className="admin-sidebar-overlay"
                    onClick={() => {

                        setMobileMenuOpen(false);

                    }}
                />

            )}


            {/* MAIN AREA */}

            <div className="admin-layout-main">

                <button
                    type="button"
                    className="admin-mobile-menu-button"
                    onClick={() => {

                        setMobileMenuOpen(
                            previous =>
                                !previous
                        );

                    }}
                    aria-label="Open Admin menu"
                >
                    ☰
                </button>


                {children}

            </div>

        </div>

    );

}


export default AdminLayout;