import {
    useEffect,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import api from "../services/api";

import "./ChangePassword.css";


function ChangePassword() {

    const navigate =
        useNavigate();


    const [user, setUser] =
        useState(null);


    const [formData, setFormData] =
        useState({

            current_password: "",

            new_password: "",

            confirm_password: ""

        });


    const [showPasswords, setShowPasswords] =
        useState(false);


    const [submitting, setSubmitting] =
        useState(false);


    const [error, setError] =
        useState("");


    const [success, setSuccess] =
        useState("");


    // =================================================
    // LOAD SESSION
    // =================================================

    useEffect(() => {

        const token =
            localStorage.getItem(
                "authToken"
            );


        const savedUser =
            localStorage.getItem(
                "authUser"
            );


        if (!token || !savedUser) {

            navigate(
                "/login",
                {
                    replace: true
                }
            );

            return;

        }


        try {

            setUser(
                JSON.parse(savedUser)
            );

        }

        catch (sessionError) {

            console.error(
                "Unable to read user session:",
                sessionError
            );


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

        }

    }, [navigate]);


    // =================================================
    // INPUT CHANGE
    // =================================================

    const handleChange = (event) => {

        const {
            name,
            value
        } = event.target;


        setFormData(
            previous => ({

                ...previous,

                [name]: value

            })
        );


        setError("");
        setSuccess("");

    };


    // =================================================
    // VALIDATE FORM
    // =================================================

    const validateForm = () => {

        if (!formData.current_password) {

            return "Current password is required.";

        }


        if (!formData.new_password) {

            return "New password is required.";

        }


        if (
            formData.new_password.length < 8
        ) {

            return "New password must contain at least 8 characters.";

        }


        if (
            !/[A-Z]/.test(
                formData.new_password
            )
        ) {

            return "New password must contain an uppercase letter.";

        }


        if (
            !/[a-z]/.test(
                formData.new_password
            )
        ) {

            return "New password must contain a lowercase letter.";

        }


        if (
            !/[0-9]/.test(
                formData.new_password
            )
        ) {

            return "New password must contain a number.";

        }


        if (
            !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(
                formData.new_password
            )
        ) {

            return "New password must contain a special character.";

        }


        if (
            formData.new_password !==
            formData.confirm_password
        ) {

            return "New password and confirmation password do not match.";

        }


        if (
            formData.current_password ===
            formData.new_password
        ) {

            return "New password must be different from your current password.";

        }


        return "";

    };


    // =================================================
    // CHANGE PASSWORD
    // =================================================

    const handleSubmit = async (event) => {

        event.preventDefault();


        const validationError =
            validateForm();


        if (validationError) {

            setError(
                validationError
            );

            return;

        }


        try {

            setSubmitting(true);
            setError("");
            setSuccess("");


            const response =
                await api.put(
                    "/auth/change-password",
                    formData
                );


            setSuccess(
                response.data.message ||
                "Password changed successfully."
            );


            localStorage.removeItem(
                "authToken"
            );

            localStorage.removeItem(
                "authUser"
            );


            window.setTimeout(
                () => {

                    navigate(
                        "/login",
                        {
                            replace: true,

                            state: {

                                message:
                                    "Password changed successfully. Please sign in with your new password."

                            }

                        }
                    );

                },
                1800
            );

        }

        catch (requestError) {

            console.error(
                "Change password error:",
                requestError
            );


            setError(
                requestError.response?.data
                    ?.message ||
                "Unable to change password."
            );

        }

        finally {

            setSubmitting(false);

        }

    };


    // =================================================
    // LOGOUT
    // =================================================

    const handleLogout = () => {

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

        <div className="change-password-page">

            <div className="change-password-card">

                <div className="change-password-brand">

                    <div className="change-password-logo">
                        G
                    </div>

                    <div>

                        <h2>
                            Gate Entry
                        </h2>

                        <span>
                            Account Security
                        </span>

                    </div>

                </div>


                <div className="change-password-heading">

                    <div className="change-password-lock">
                        🔐
                    </div>

                    <h1>
                        Change your password
                    </h1>

                    <p>
                        You must set a secure password before continuing to your portal.
                    </p>

                </div>


                {user && (

                    <div className="change-password-user">

                        <div className="change-password-avatar">

                            {
                                (
                                    user.name ||
                                    user.username ||
                                    "U"
                                )
                                    .charAt(0)
                                    .toUpperCase()
                            }

                        </div>

                        <div>

                            <strong>

                                {
                                    user.name ||
                                    user.username ||
                                    "User"
                                }

                            </strong>

                            <span>

                                {
                                    user.email ||
                                    user.username ||
                                    user.role
                                }

                            </span>

                            <small>
                                {user.role}
                            </small>

                        </div>

                    </div>

                )}


                {error && (

                    <div className="change-password-error">
                        {error}
                    </div>

                )}


                {success && (

                    <div className="change-password-success">
                        {success}
                    </div>

                )}


                <form
                    className="change-password-form"
                    onSubmit={handleSubmit}
                >

                    <div className="change-password-field">

                        <label htmlFor="current_password">
                            Current password
                        </label>

                        <input
                            id="current_password"
                            name="current_password"
                            type={
                                showPasswords
                                    ? "text"
                                    : "password"
                            }
                            value={
                                formData.current_password
                            }
                            onChange={handleChange}
                            autoComplete="current-password"
                            placeholder="Enter temporary or current password"
                            disabled={submitting}
                        />

                    </div>


                    <div className="change-password-field">

                        <label htmlFor="new_password">
                            New password
                        </label>

                        <input
                            id="new_password"
                            name="new_password"
                            type={
                                showPasswords
                                    ? "text"
                                    : "password"
                            }
                            value={
                                formData.new_password
                            }
                            onChange={handleChange}
                            autoComplete="new-password"
                            placeholder="Enter your new password"
                            disabled={submitting}
                        />

                    </div>


                    <div className="change-password-field">

                        <label htmlFor="confirm_password">
                            Confirm new password
                        </label>

                        <input
                            id="confirm_password"
                            name="confirm_password"
                            type={
                                showPasswords
                                    ? "text"
                                    : "password"
                            }
                            value={
                                formData.confirm_password
                            }
                            onChange={handleChange}
                            autoComplete="new-password"
                            placeholder="Enter the new password again"
                            disabled={submitting}
                        />

                    </div>


                    <label className="change-password-show">

                        <input
                            type="checkbox"
                            checked={showPasswords}
                            onChange={event => {

                                setShowPasswords(
                                    event.target.checked
                                );

                            }}
                        />

                        <span>
                            Show passwords
                        </span>

                    </label>


                    <div className="password-rules">

                        <strong>
                            Your password must contain:
                        </strong>

                        <ul>

                            <li>
                                At least 8 characters
                            </li>

                            <li>
                                One uppercase and one lowercase letter
                            </li>

                            <li>
                                One number
                            </li>

                            <li>
                                One special character
                            </li>

                        </ul>

                    </div>


                    <button
                        type="submit"
                        className="change-password-submit"
                        disabled={
                            submitting ||
                            Boolean(success)
                        }
                    >

                        {
                            submitting
                                ? "Changing password..."
                                : "Change Password"
                        }

                    </button>


                    <button
                        type="button"
                        className="change-password-logout"
                        onClick={handleLogout}
                        disabled={submitting}
                    >
                        Sign out
                    </button>

                </form>

            </div>

        </div>

    );

}


export default ChangePassword;