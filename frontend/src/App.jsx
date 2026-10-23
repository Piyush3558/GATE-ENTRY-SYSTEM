import {
    BrowserRouter,
    Navigate,
    Route,
    Routes
} from "react-router-dom";

import Login from "./components/Login";

import Layout from "./components/Layout";

import OfficialDashboard from
    "./components/OfficialDashboard";

import AdminDashboard from
    "./components/AdminDashboard";

import AdminEmployeeAccess from
    "./components/AdminEmployeeAccess";

import AdminLayout from
    "./components/AdminLayout";

import ProtectedRoute from
    "./components/ProtectedRoute";

import "./App.css";


// =====================================================
// CLEAR SESSION
// =====================================================

const clearSession = () => {

    localStorage.removeItem(
        "authToken"
    );

    localStorage.removeItem(
        "authUser"
    );

};


// =====================================================
// ROOT REDIRECTION
// =====================================================

function HomeRedirect() {

    const token =
        localStorage.getItem(
            "authToken"
        );


    if (!token) {

        return (

            <Navigate
                to="/login"
                replace
            />

        );

    }


    try {

        const savedUser =
            localStorage.getItem(
                "authUser"
            );


        const user =
            savedUser
                ? JSON.parse(savedUser)
                : null;


        if (!user?.role) {

            clearSession();


            return (

                <Navigate
                    to="/login"
                    replace
                />

            );

        }


        const role =
            user.role.toUpperCase();


        if (role === "ADMIN") {

            return (

                <Navigate
                    to="/admin/dashboard"
                    replace
                />

            );

        }


        if (role === "SECURITY") {

            return (

                <Navigate
                    to="/security/dashboard"
                    replace
                />

            );

        }


        if (role === "OFFICIAL") {

            return (

                <Navigate
                    to="/official/dashboard"
                    replace
                />

            );

        }

    }

    catch (error) {

        console.error(
            "Unable to read saved login:",
            error
        );

    }


    clearSession();


    return (

        <Navigate
            to="/login"
            replace
        />

    );

}


// =====================================================
// APPLICATION
// =====================================================

function App() {

    return (

        <BrowserRouter>

            <Routes>


                {/* ROOT */}

                <Route
                    path="/"
                    element={
                        <HomeRedirect />
                    }
                />


                {/* COMMON LOGIN */}

                <Route
                    path="/login"
                    element={
                        <Login />
                    }
                />


                {/* OLD OFFICIAL LOGIN URL */}

                <Route
                    path="/official/login"
                    element={

                        <Navigate
                            to="/login"
                            replace
                        />

                    }
                />


                {/* ADMIN VISITOR DASHBOARD */}

                <Route
                    path="/admin/dashboard"
                    element={

                        <ProtectedRoute
                            allowedRole="ADMIN"
                        >

                            <AdminLayout>

                                <AdminDashboard />

                            </AdminLayout>

                        </ProtectedRoute>

                    }
                />


                {/* ADMIN EMPLOYEES AND ACCESS */}

                <Route
                    path="/admin/employees"
                    element={

                        <ProtectedRoute
                            allowedRole="ADMIN"
                        >

                            <AdminLayout>

                                <AdminEmployeeAccess />

                            </AdminLayout>

                        </ProtectedRoute>

                    }
                />


                {/* SECURITY DASHBOARD */}

                <Route
                    path="/security/dashboard"
                    element={

                        <ProtectedRoute
                            allowedRole="SECURITY"
                        >

                            <Layout />

                        </ProtectedRoute>

                    }
                />


                {/* SECURITY VISITORS */}

                <Route
                    path="/security/visitors"
                    element={

                        <ProtectedRoute
                            allowedRole="SECURITY"
                        >

                            <Layout />

                        </ProtectedRoute>

                    }
                />


                {/* OFFICIAL DASHBOARD */}

                <Route
                    path="/official/dashboard"
                    element={

                        <ProtectedRoute
                            allowedRole="OFFICIAL"
                        >

                            <OfficialDashboard />

                        </ProtectedRoute>

                    }
                />


                {/* UNKNOWN URL */}

                <Route
                    path="*"
                    element={
                        <HomeRedirect />
                    }
                />

            </Routes>

        </BrowserRouter>

    );

}


export default App;