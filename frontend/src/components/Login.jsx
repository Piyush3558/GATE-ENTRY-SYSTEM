import {
    useEffect,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import api from "../services/api";

import "./Login.css";


// =====================================================
// GET DASHBOARD PATH
// =====================================================

const getDashboardPath = role => {

    const normalizedRole =
        role
            ?.toUpperCase();


    if (
        normalizedRole ===
        "ADMIN"
    ) {

        return "/admin/dashboard";

    }


    if (
        normalizedRole ===
        "SECURITY"
    ) {

        return "/security/dashboard";

    }


    if (
        normalizedRole ===
        "OFFICIAL"
    ) {

        return "/official/dashboard";

    }


    return null;

};


function Login() {

    const navigate =
        useNavigate();


    // =====================================================
    // STATE
    // =====================================================

    const [loginId, setLoginId] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [checkingSession, setCheckingSession] =
        useState(true);

    const [error, setError] =
        useState("");


    // =====================================================
    // REDIRECT BY ROLE
    // =====================================================

    const redirectByRole = role => {

        const dashboardPath =
            getDashboardPath(
                role
            );


        if (!dashboardPath) {

            setError(
                "This account does not have a valid system role."
            );

            return false;

        }


        navigate(
            dashboardPath,
            {
                replace: true
            }
        );


        return true;

    };


    // =====================================================
    // CHECK EXISTING SESSION
    // =====================================================

    useEffect(() => {

        let componentMounted =
            true;


        const checkSession =
            async () => {

                const token =
                    localStorage.getItem(
                        "authToken"
                    );


                if (!token) {

                    if (componentMounted) {

                        setCheckingSession(false);

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
                        response.data.user;


                    if (
                        !response.data.success ||
                        !currentUser
                    ) {

                        throw new Error(
                            "Invalid login session."
                        );

                    }


                    localStorage.setItem(
                        "authUser",
                        JSON.stringify(
                            currentUser
                        )
                    );


                    const dashboardPath =
                        getDashboardPath(
                            currentUser.role
                        );


                    if (!dashboardPath) {

                        throw new Error(
                            "Invalid account role."
                        );

                    }


                    if (componentMounted) {

                        navigate(
                            dashboardPath,
                            {
                                replace: true
                            }
                        );

                    }

                }

                catch (sessionError) {

                    console.error(
                        "Session validation failed:",
                        sessionError
                    );


                    localStorage.removeItem(
                        "authToken"
                    );

                    localStorage.removeItem(
                        "authUser"
                    );


                    if (componentMounted) {

                        setCheckingSession(false);

                    }

                }

            };


        checkSession();


        return () => {

            componentMounted = false;

        };

    }, [navigate]);


    // =====================================================
    // HANDLE LOGIN ID
    // =====================================================

    const handleLoginIdChange =
        event => {

            const enteredValue =
                event.target.value;


            // Admin and Security usernames
            if (
                !enteredValue.includes("@")
            ) {

                setLoginId(
                    enteredValue
                        .replace(/\s/g, "")
                );

                setError("");

                return;

            }


            // Complete official email domain automatically
            const emailUsername =
                enteredValue
                    .split("@")[0]
                    .replace(/\s/g, "");


            setLoginId(
                emailUsername
                    ? `${emailUsername}@in.ufifilters.com`
                    : ""
            );

            setError("");

        };


    // =====================================================
    // LOGIN
    // =====================================================

    const handleLogin =
        async event => {

            event.preventDefault();

            setError("");


            const cleanedLoginId =
                loginId
                    .trim()
                    .toLowerCase();


            if (!cleanedLoginId) {

                setError(
                    "Enter your username or official email."
                );

                return;

            }


            if (!password) {

                setError(
                    "Enter your password."
                );

                return;

            }


            const officeEmailPattern =
                /^[A-Z0-9._%+-]+@in\.ufifilters\.com$/i;


            if (
                cleanedLoginId.includes("@") &&
                !officeEmailPattern.test(
                    cleanedLoginId
                )
            ) {

                setError(
                    "Only @in.ufifilters.com official email addresses are allowed."
                );

                return;

            }


            try {

                setLoading(true);


                const response =
                    await api.post(
                        "/auth/login",
                        {
                            login_id:
                                cleanedLoginId,

                            password
                        }
                    );


                if (
                    !response.data.success ||
                    !response.data.token ||
                    !response.data.user
                ) {

                    setError(
                        response.data.message ||
                        "Unable to sign in."
                    );

                    return;

                }


                localStorage.setItem(
                    "authToken",
                    response.data.token
                );


                localStorage.setItem(
                    "authUser",
                    JSON.stringify(
                        response.data.user
                    )
                );


                // Remove old separate official session
                localStorage.removeItem(
                    "officialToken"
                );

                localStorage.removeItem(
                    "official"
                );


                const redirected =
                    redirectByRole(
                        response.data.user.role
                    );


                if (!redirected) {

                    localStorage.removeItem(
                        "authToken"
                    );

                    localStorage.removeItem(
                        "authUser"
                    );

                }

            }

            catch (loginError) {

                console.error(
                    "Login error:",
                    loginError
                );


                setError(
                    loginError.response?.data?.message ||
                    "Unable to sign in. Check your login details."
                );

            }

            finally {

                setLoading(false);

            }

        };


    // =====================================================
    // SESSION CHECK
    // =====================================================

    if (checkingSession) {

        return (

            <div className="login-page">

                <div className="login-loading-card">

                    <img
                        src="/images/ufi-logo.png"
                        alt="UFI Filters"
                        className="login-loading-logo"
                    />

                    <div className="login-spinner" />

                    <p>
                        Checking session...
                    </p>

                </div>

            </div>

        );

    }


    // =====================================================
    // LOGIN SCREEN
    // =====================================================

    return (

        <main className="login-page">

            <section className="login-card">

                {/* COMPANY LOGO */}

                <div className="login-logo-section">

                    <img
                        src="/images/ufi-logo.png"
                        alt="UFI Filters"
                        className="login-company-logo"
                    />

                </div>


                {/* HEADING */}

                <div className="login-heading">

                    <h1>
                        Gate Entry
                    </h1>

                    <p>
                        Sign in to continue
                    </p>

                </div>


                {/* ERROR */}

                {error && (

                    <div
                        className="login-error"
                        role="alert"
                    >
                        {error}
                    </div>

                )}


                {/* LOGIN FORM */}

                <form
                    className="login-form"
                    onSubmit={
                        handleLogin
                    }
                    autoComplete="off"
                >

                    <div className="login-field">

                        <label htmlFor="loginId">
                            Username or Official Email
                        </label>


                        <input
                            id="loginId"
                            type="text"
                            name="gate_entry_login_id"
                            value={
                                loginId
                            }
                            onChange={
                                handleLoginIdChange
                            }
                            placeholder="Enter username or email"
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                            disabled={
                                loading
                            }
                            autoFocus
                        />


                        <small>
                            Officials: type your email name and then @
                        </small>

                    </div>


                    <div className="login-field">

                        <label htmlFor="loginPassword">
                            Password
                        </label>


                        <div className="login-password-wrapper">

                            <input
                                id="loginPassword"
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                name="gate_entry_password"
                                value={
                                    password
                                }
                                onChange={event => {

                                    setPassword(
                                        event.target.value
                                    );

                                    setError("");

                                }}
                                placeholder="Enter password"
                                autoComplete="current-password"
                                disabled={
                                    loading
                                }
                            />


                            <button
                                type="button"
                                className="login-password-toggle"
                                onClick={() => {

                                    setShowPassword(
                                        previous =>
                                            !previous
                                    );

                                }}
                                disabled={
                                    loading
                                }
                                aria-label={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                            >

                                {
                                    showPassword
                                        ? "Hide"
                                        : "Show"
                                }

                            </button>

                        </div>

                    </div>


                    <button
                        type="submit"
                        className="login-submit-button"
                        disabled={
                            loading
                        }
                    >

                        {
                            loading
                                ? (
                                    <>
                                        <span className="button-spinner" />

                                        Signing in...
                                    </>
                                )
                                : "Sign In"
                        }

                    </button>

                </form>


                <div className="login-footer">

                    <span className="login-security-indicator">
                        ✓
                    </span>

                    <span>
                        Secure Visitor Management System
                    </span>

                </div>

            </section>

        </main>

    );

}


export default Login;