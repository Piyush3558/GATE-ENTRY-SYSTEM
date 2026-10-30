import {
    useMemo,
    useState
} from "react";

import {
    useLocation,
    useNavigate
} from "react-router-dom";

import Dashboard from "./Dashboard";
import Visitors from "./Visitors";
import AccountMenu from "./AccountMenu";

import "./Layout.css";


function Layout() {

    const navigate =
        useNavigate();

    const location =
        useLocation();


    // =====================================================
    // MOBILE MENU
    // =====================================================

    const [mobileMenuOpen, setMobileMenuOpen] =
        useState(false);


    // =====================================================
    // LOGGED-IN SECURITY USER
    // =====================================================

    const securityUser =
        useMemo(() => {

            try {

                const savedUser =
                    localStorage.getItem(
                        "authUser"
                    );


                return savedUser
                    ? JSON.parse(
                        savedUser
                    )
                    : null;

            }

            catch (error) {

                console.error(
                    "Unable to read logged-in user:",
                    error
                );


                return null;

            }

        }, []);


    // =====================================================
    // CURRENT PAGE
    // =====================================================

    const currentPage =
        location.pathname ===
        "/security/visitors"

            ? "visitors"

            : "dashboard";


    // =====================================================
    // NAVIGATION
    // =====================================================

    const handleNavigation = (
        path
    ) => {

        navigate(path);

        setMobileMenuOpen(false);

    };


    // =====================================================
    // LOGOUT
    // =====================================================

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

        localStorage.removeItem(
            "officialToken"
        );

        localStorage.removeItem(
            "official"
        );


        navigate(
            "/login",
            {
                replace: true
            }
        );

    };


    // =====================================================
    // SECURITY PORTAL
    // =====================================================

    return (

        <div className="app-layout">


            {/* SIDEBAR */}

            <aside
                className={`sidebar ${
                    mobileMenuOpen
                        ? "sidebar-open"
                        : ""
                }`}
            >

                {/* LOGO */}

                <div className="sidebar-logo">

    <img
        src="/images/ufi-logo.png"
        alt="UFI Filters"
        className="security-company-logo"
    />

    <div className="security-sidebar-brand-text">

        <strong>
            Gate Entry
        </strong>

        <span>
            Security Portal
        </span>

    </div>

</div>


                {/* NAVIGATION */}

                <nav className="sidebar-nav">

                    <div className="nav-section-title">
                        VISITOR MANAGEMENT
                    </div>


                    {/* DASHBOARD */}

                    <button
                        type="button"
                        className={`nav-item ${
                            currentPage ===
                            "dashboard"

                                ? "active"

                                : ""
                        }`}
                        onClick={() =>
                            handleNavigation(
                                "/security/dashboard"
                            )
                        }
                    >

                        <span className="nav-icon">
                            ▣
                        </span>

                        Dashboard

                    </button>


                    {/* VISITORS */}

                    <button
                        type="button"
                        className={`nav-item ${
                            currentPage ===
                            "visitors"

                                ? "active"

                                : ""
                        }`}
                        onClick={() =>
                            handleNavigation(
                                "/security/visitors"
                            )
                        }
                    >

                        <span className="nav-icon">
                            👥
                        </span>

                        Visitors

                    </button>


                    

                </nav>


                {/* SIDEBAR USER */}

                <div className="sidebar-footer">

                    <div className="security-user">

                        <div className="user-avatar">

                            {
                                (
                                    securityUser?.name ||
                                    "S"
                                )
                                    .charAt(0)
                                    .toUpperCase()
                            }

                        </div>


                        <div className="security-user-details">

                            <strong>
                                {
                                    securityUser?.name ||
                                    "Security Guard"
                                }
                            </strong>

                            <span>
                                Security Operator
                            </span>

                        </div>

                    </div>


                    <button
                        type="button"
                        className="sidebar-logout-button"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>

                </div>

            </aside>


            {/* MOBILE OVERLAY */}

            {mobileMenuOpen && (

                <div
                    className="mobile-overlay"
                    onClick={() =>
                        setMobileMenuOpen(false)
                    }
                />

            )}


            {/* MAIN AREA */}

            <div className="main-area">


                {/* HEADER */}

                <header className="top-header">

                    <button
                        type="button"
                        className="mobile-menu-button"
                        onClick={() =>
                            setMobileMenuOpen(
                                previous =>
                                    !previous
                            )
                        }
                        aria-label="Open navigation menu"
                    >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M4 7h16" />
                            <path d="M4 12h16" />
                            <path d="M4 17h16" />
                        </svg>
                    </button>

                    <div className="security-mobile-brand">
                        <img
                            src="/images/ufi-logo.png"
                            alt="UFI Filters and SOFIMA Filter"
                        />
                        <div>
                            <strong>Gate Entry</strong>
                            <span>Security</span>
                        </div>
                    </div>


                    <div className="header-title">

                        <strong>
                            {
                                currentPage ===
                                "visitors"

                                    ? "Visitors"

                                    : "Dashboard"
                            }
                        </strong>

                        <span>
                            Visitor Management System
                        </span>

                    </div>


                    <div className="header-right">

                        <div className="header-date">

                            {
                                new Date()
                                    .toLocaleDateString(
                                        "en-IN",
                                        {
                                            day:
                                                "2-digit",

                                            month:
                                                "short",

                                            year:
                                                "numeric"
                                        }
                                    )
                            }

                        </div>


                        <AccountMenu
                            name={
                                securityUser?.name ||
                                "Security Guard"
                            }
                            role={
                                securityUser?.role ||
                                "Security"
                            }
                            onLogout={handleLogout}
                            useProfileIcon
                        />

                    </div>

                </header>


                {/* PAGE CONTENT */}

                <main className="page-content">

                    {
                        currentPage ===
                        "dashboard"

                            ? <Dashboard />

                            : <Visitors />
                    }

                </main>

            </div>

        </div>

    );

}


export default Layout;
