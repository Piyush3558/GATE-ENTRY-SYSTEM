import {
    useEffect,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import api from "../services/api";

import "./OfficialLogin.css";


function OfficialLogin() {

    const navigate =
        useNavigate();


    // =====================================================
    // FORM STATE
    // =====================================================

    const [email, setEmail] =
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
    // CHECK EXISTING SESSION
    // =====================================================

    useEffect(() => {

        const checkExistingSession =
            async () => {

                const token =
                    localStorage.getItem(
                        "officialToken"
                    );


                if (!token) {

                    setCheckingSession(false);

                    return;

                }


                try {

                    const response =
                        await api.get(
                            "/official/me",
                            {
                                headers: {
                                    Authorization:
                                        `Bearer ${token}`
                                }
                            }
                        );


                    if (
                        response.data.success
                    ) {

                        localStorage.setItem(
                            "official",
                            JSON.stringify(
                                response.data.official
                            )
                        );


                        navigate(
                            "/official/dashboard",
                            {
                                replace: true
                            }
                        );

                    }

                }

                catch (sessionError) {

                    console.error(
                        "Existing official session is invalid:",
                        sessionError
                    );


                    localStorage.removeItem(
                        "officialToken"
                    );

                    localStorage.removeItem(
                        "official"
                    );


                    setCheckingSession(false);

                }

            };


        checkExistingSession();

    }, [navigate]);


    // =====================================================
    // OFFICIAL LOGIN
    // =====================================================

    const handleLogin = async (event) => {

        event.preventDefault();

        setError("");


        const cleanedEmail =
            email.trim();


        if (!cleanedEmail) {

            setError(
                "Please enter your official email."
            );

            return;

        }


        if (!password) {

            setError(
                "Please enter your password."
            );

            return;

        }


        try {

            setLoading(true);


            const response =
                await api.post(
                    "/official/login",
                    {
                        email:
                            cleanedEmail,

                        password
                    }
                );


            if (
                response.data.success &&
                response.data.token
            ) {

                localStorage.setItem(
                    "officialToken",
                    response.data.token
                );


                localStorage.setItem(
                    "official",
                    JSON.stringify(
                        response.data.official
                    )
                );


                navigate(
                    "/official/dashboard",
                    {
                        replace: true
                    }
                );

                return;

            }


            setError(
                response.data.message ||
                "Unable to sign in."
            );

        }

        catch (loginError) {

            console.error(
                "Official login error:",
                loginError
            );


            setError(
                loginError.response?.data?.message ||
                "Unable to sign in. Please check your email and password."
            );

        }

        finally {

            setLoading(false);

        }

    };


    // =====================================================
    // SESSION CHECK LOADING
    // =====================================================

    if (checkingSession) {

        return (

            <div className="official-login-page">

                <div className="official-login-card">

                    <div className="official-login-logo">

                        <div className="official-login-logo-icon">
                            G
                        </div>

                    </div>


                    <div className="official-login-header">

                        <h1>
                            Checking Session
                        </h1>

                        <p>
                            Please wait...
                        </p>

                    </div>

                </div>

            </div>

        );

    }


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="official-login-page">

            <div className="official-login-card">


                {/* LOGO */}

                <div className="official-login-logo">

                    <div className="official-login-logo-icon">
                        G
                    </div>

                </div>


                {/* HEADER */}

                <div className="official-login-header">

                    <span className="official-login-label">
                        GATE ENTRY MANAGEMENT
                    </span>

                    <h1>
                        Official Login
                    </h1>

                    <p>
                        Sign in to review and respond to
                        visitor requests assigned to you.
                    </p>

                </div>


                {/* ERROR */}

                {error && (

                    <div
                        className="official-login-error"
                        role="alert"
                    >
                        {error}
                    </div>

                )}


                {/* FORM */}

                <form
                    className="official-login-form"
                    onSubmit={handleLogin}
                >

                    <div className="official-login-field">

                        <label htmlFor="officialEmail">
                            Official Email
                        </label>

                        <input
                            id="officialEmail"
                            type="email"
                            value={email}
                            onChange={(event) => {

                                setEmail(
                                    event.target.value
                                );

                                setError("");

                            }}
                            placeholder="Enter your official email"
                            autoComplete="username"
                            disabled={loading}
                            autoFocus
                        />

                    </div>


                    <div className="official-login-field">

                        <label htmlFor="officialPassword">
                            Password
                        </label>


                        <div className="official-password-wrapper">

                            <input
                                id="officialPassword"
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                value={password}
                                onChange={(event) => {

                                    setPassword(
                                        event.target.value
                                    );

                                    setError("");

                                }}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                disabled={loading}
                            />


                            <button
                                type="button"
                                className="official-password-toggle"
                                onClick={() =>
                                    setShowPassword(
                                        previous =>
                                            !previous
                                    )
                                }
                                disabled={loading}
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
                        className="official-login-button"
                        disabled={loading}
                    >

                        {
                            loading
                                ? "Signing in..."
                                : "Sign In to Official Portal"
                        }

                    </button>

                </form>


                {/* SECURITY NOTE */}

                <div className="official-login-security">

                    <span className="official-security-icon">
                        ✓
                    </span>

                    <div>

                        <strong>
                            Secure Official Access
                        </strong>

                        <p>
                            Your session will automatically
                            expire after 8 hours.
                        </p>

                    </div>

                </div>


                {/* FOOTER */}

                <div className="official-login-footer">

                    <span>
                        Gate Entry Management System
                    </span>

                </div>

            </div>

        </div>

    );

}


export default OfficialLogin;