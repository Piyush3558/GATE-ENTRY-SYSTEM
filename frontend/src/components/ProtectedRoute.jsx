import {
    useEffect,
    useState
} from "react";

import {
    Navigate,
    useLocation
} from "react-router-dom";

import api from "../services/api";


function ProtectedRoute({
    allowedRole,
    children
}) {

    const location =
        useLocation();


    const [checking, setChecking] =
        useState(true);


    const [authorized, setAuthorized] =
        useState(false);


    const [userRole, setUserRole] =
        useState(null);


    // =====================================================
    // VERIFY SESSION
    // =====================================================

    useEffect(() => {

        let componentMounted = true;


        const verifySession = async () => {

            const token =
                localStorage.getItem(
                    "authToken"
                );


            if (!token) {

                if (componentMounted) {

                    setUserRole(null);
                    setAuthorized(false);
                    setChecking(false);

                }

                return;

            }


            try {

                const response =
                    await api.get(
                        "/auth/me",
                        {
                            headers: {

                                Authorization:
                                    `Bearer ${token}`

                            }
                        }
                    );


                const currentUser =
                    response.data?.user;


                if (
                    !currentUser ||
                    !currentUser.role
                ) {

                    throw new Error(
                        "Invalid user session."
                    );

                }


                const currentRole =
                    currentUser.role
                        .toUpperCase();


                if (componentMounted) {

                    localStorage.setItem(
                        "authUser",
                        JSON.stringify(
                            currentUser
                        )
                    );


                    setUserRole(
                        currentRole
                    );


                    setAuthorized(
                        currentRole ===
                        allowedRole.toUpperCase()
                    );


                    setChecking(false);

                }

            }

            catch (sessionError) {

                console.error(
                    "Protected route validation failed:",
                    sessionError
                );


                localStorage.removeItem(
                    "authToken"
                );

                localStorage.removeItem(
                    "authUser"
                );


                if (componentMounted) {

                    setUserRole(null);
                    setAuthorized(false);
                    setChecking(false);

                }

            }

        };


        verifySession();


        return () => {

            componentMounted = false;

        };

    }, [
        allowedRole,
        location.pathname
    ]);


    // =====================================================
    // VERIFYING
    // =====================================================

    if (checking) {

        return (

            <div className="route-loading-page">

                <div className="route-loading-spinner" />

                <h2>
                    Verifying access
                </h2>

                <p>
                    Please wait...
                </p>

            </div>

        );

    }


    // =====================================================
    // NOT LOGGED IN
    // =====================================================

    if (!userRole) {

        return (

            <Navigate
                to="/login"
                replace
                state={{

                    from:
                        location.pathname

                }}
            />

        );

    }


    // =====================================================
    // WRONG ROLE
    // =====================================================

    if (!authorized) {

        if (userRole === "ADMIN") {

            return (

                <Navigate
                    to="/admin/dashboard"
                    replace
                />

            );

        }


        if (userRole === "SECURITY") {

            return (

                <Navigate
                    to="/security/dashboard"
                    replace
                />

            );

        }


        if (userRole === "OFFICIAL") {

            return (

                <Navigate
                    to="/official/dashboard"
                    replace
                />

            );

        }


        return (

            <Navigate
                to="/login"
                replace
            />

        );

    }


    return children;

}


export default ProtectedRoute;