import {
    useEffect,
    useMemo,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import api from "../services/api";
import AccountMenu from "./AccountMenu";

import "./OfficialDashboard.css";


function OfficialDashboard() {

    const navigate =
        useNavigate();


    // =====================================================
    // STATE
    // =====================================================

    const [official, setOfficial] =
        useState(null);

    const [visitors, setVisitors] =
        useState([]);

    const [summary, setSummary] =
        useState({
            total: 0,
            pending: 0,
            approved: 0,
            rejected: 0
        });

    const [statusFilter, setStatusFilter] =
        useState("ALL");

    const [search, setSearch] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [actionLoading, setActionLoading] =
        useState(null);

    const [error, setError] =
        useState("");

    const [message, setMessage] =
        useState("");

    const [selectedPhoto, setSelectedPhoto] =
        useState(null);

    const [rejectVisitor, setRejectVisitor] =
        useState(null);

    const [rejectionReason, setRejectionReason] =
        useState("");


    // =====================================================
    // AUTHENTICATION
    // =====================================================

    const getToken = () => {

    return localStorage.getItem(
        "authToken"
    );

};


    const getAuthConfig = () => {

        const token =
            getToken();


        return {

            headers: {

                Authorization:
                    `Bearer ${token}`

            }

        };

    };


    const logout = () => {

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


    const handleApiError = (
        apiError,
        fallbackMessage
    ) => {

        console.error(
            fallbackMessage,
            apiError
        );


        if (
            apiError.response?.status === 401 ||
            apiError.response?.status === 403
        ) {

            logout();

            return;

        }


        setError(
            apiError.response?.data?.message ||
            fallbackMessage
        );

    };


    // =====================================================
    // PHOTO URL
    // =====================================================

    const getPhotoUrl = (photoPath) => {

        if (!photoPath) {
            return "";
        }


        if (
            photoPath.startsWith("http://") ||
            photoPath.startsWith("https://")
        ) {

            return photoPath;

        }


        let backendRoot =
            api.defaults.baseURL || "";


        backendRoot =
            backendRoot.replace(
                /\/api\/?$/,
                ""
            );


        const normalizedPath =
            photoPath.startsWith("/")
                ? photoPath
                : `/${photoPath}`;


        return (
            `${backendRoot}${normalizedPath}`
        );

    };


    // =====================================================
    // LOAD CURRENT OFFICIAL
    // =====================================================

    const loadOfficial = async () => {

    const response =
        await api.get(
            "/auth/me",
            getAuthConfig()
        );


    const currentUser =
        response.data.user;


    if (
        !currentUser ||
        currentUser.role !==
            "OFFICIAL"
    ) {

        throw new Error(
            "Official access is required."
        );

    }


    setOfficial(
        currentUser
    );


    localStorage.setItem(
        "authUser",
        JSON.stringify(
            currentUser
        )
    );

};


    // =====================================================
    // LOAD VISITOR REQUESTS
    // =====================================================

    const loadVisitors = async () => {

        const response =
            await api.get(
                "/official/visitors",
                getAuthConfig()
            );


        setVisitors(
            response.data.visitors || []
        );


        setSummary({
            total:
                Number(
                    response.data.summary?.total
                ) || 0,

            pending:
                Number(
                    response.data.summary?.pending
                ) || 0,

            approved:
                Number(
                    response.data.summary?.approved
                ) || 0,

            rejected:
                Number(
                    response.data.summary?.rejected
                ) || 0
        });

    };


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        const initializeDashboard =
            async () => {

                const token =
                    getToken();


                if (!token) {

    navigate(
        "/login",
        {
            replace: true
        }
    );

    return;

}


                try {

                    setLoading(true);

                    setError("");


                    await Promise.all([
                        loadOfficial(),
                        loadVisitors()
                    ]);

                }

                catch (initializationError) {

                    handleApiError(
                        initializationError,
                        "Unable to load the Official Portal."
                    );

                }

                finally {

                    setLoading(false);

                }

            };


        initializeDashboard();

    }, []);


    // =====================================================
    // FILTER REQUESTS
    // =====================================================

    const filteredVisitors =
        useMemo(() => {

            const searchValue =
                search
                    .trim()
                    .toLowerCase();


            return visitors.filter(
                (visitor) => {

                    const approvalStatus =
                        (
                            visitor.approval_status ||
                            "PENDING"
                        ).toUpperCase();


                    const matchesStatus =
                        statusFilter === "ALL" ||
                        approvalStatus ===
                            statusFilter;


                    const matchesSearch =
                        !searchValue ||

                        visitor.visitor_name
                            ?.toLowerCase()
                            .includes(
                                searchValue
                            ) ||

                        visitor.mobile_number
                            ?.toLowerCase()
                            .includes(
                                searchValue
                            ) ||

                        visitor.purpose_of_visit
                            ?.toLowerCase()
                            .includes(
                                searchValue
                            ) ||

                        visitor.address
                            ?.toLowerCase()
                            .includes(
                                searchValue
                            );


                    return (
                        matchesStatus &&
                        matchesSearch
                    );

                }
            );

        }, [
            visitors,
            statusFilter,
            search
        ]);


    // =====================================================
    // APPROVE VISITOR
    // =====================================================

    const handleApprove = async (
        visitor
    ) => {

        const confirmed =
            window.confirm(
                `Approve visitor request for ${visitor.visitor_name}?`
            );


        if (!confirmed) {
            return;
        }


        try {

            setActionLoading(
                visitor.id
            );

            setError("");

            setMessage("");


            const response =
                await api.put(
                    `/official/visitors/${visitor.id}/approve`,
                    {},
                    getAuthConfig()
                );


            setMessage(
                response.data.message ||
                "Visitor request approved."
            );


            await loadVisitors();

        }

        catch (approvalError) {

            handleApiError(
                approvalError,
                "Unable to approve visitor request."
            );

        }

        finally {

            setActionLoading(null);

        }

    };


    // =====================================================
    // OPEN REJECTION POPUP
    // =====================================================

    const openRejectPopup = (
        visitor
    ) => {

        setRejectVisitor(
            visitor
        );

        setRejectionReason("");

        setError("");

        setMessage("");

    };


    // =====================================================
    // CLOSE REJECTION POPUP
    // =====================================================

    const closeRejectPopup = () => {

        if (actionLoading) {
            return;
        }


        setRejectVisitor(null);

        setRejectionReason("");

    };


    // =====================================================
    // REJECT VISITOR
    // =====================================================

    const handleReject = async (event) => {

        event.preventDefault();


        if (
            !rejectionReason.trim()
        ) {

            setError(
                "Please enter a rejection reason."
            );

            return;

        }


        try {

            setActionLoading(
                rejectVisitor.id
            );

            setError("");

            setMessage("");


            const response =
                await api.put(
                    `/official/visitors/${rejectVisitor.id}/reject`,

                    {
                        rejection_reason:
                            rejectionReason.trim()
                    },

                    getAuthConfig()
                );


            setMessage(
                response.data.message ||
                "Visitor request rejected."
            );


            setRejectVisitor(null);

            setRejectionReason("");


            await loadVisitors();

        }

        catch (rejectionError) {

            handleApiError(
                rejectionError,
                "Unable to reject visitor request."
            );

        }

        finally {

            setActionLoading(null);

        }

    };


    // =====================================================
    // DATE FORMAT
    // =====================================================

    const formatDate = (dateValue) => {

        if (!dateValue) {
            return "-";
        }


        const parts =
            dateValue.split("-");


        if (parts.length !== 3) {
            return dateValue;
        }


        return (
            `${parts[2]}-${parts[1]}-${parts[0]}`
        );

    };


    // =====================================================
    // STATUS LABEL
    // =====================================================

    const getStatusLabel = (
        status
    ) => {

        switch (
            (
                status ||
                "PENDING"
            ).toUpperCase()
        ) {

            case "APPROVED":
                return "Approved";

            case "REJECTED":
                return "Rejected";

            default:
                return "Pending";

        }

    };


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (

            <div className="official-loading-page">

                <div className="official-loader" />

                <h2>
                    Loading Official Portal
                </h2>

                <p>
                    Please wait while your visitor
                    requests are loaded.
                </p>

            </div>

        );

    }


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="official-dashboard-page">


            {/* HEADER */}

            <header className="official-dashboard-header">

                <div className="official-sidebar-brand">

    <img
        src="/images/ufi-logo.png"
        alt="UFI Filters"
        className="official-company-logo"
    />


    <div className="official-sidebar-brand-text">

        <strong>
            Gate Entry
        </strong>

        <span>
            Official Portal
        </span>

    </div>

</div>


                <AccountMenu
                    name={
                        official?.name ||
                        official?.employee_name ||
                        "Official"
                    }
                    role={
                        official?.role ||
                        official?.department_name ||
                        official?.unit ||
                        "Employee"
                    }
                    onLogout={logout}
                    className="official-account-menu"
                />

            </header>


            {/* CONTENT */}

            <main className="official-dashboard-content">


                {/* PAGE TITLE */}

                <section className="official-welcome">

                    <div>

                        <span className="official-eyebrow">
                            VISITOR MANAGEMENT
                        </span>

                        <h2>
                            Visitor Requests
                        </h2>

                        <p>
                            Review and respond to visitor
                            requests assigned to you.
                        </p>

                    </div>


                    <button
                        type="button"
                        className="official-refresh-btn"
                        onClick={async () => {

                            try {

                                setLoading(true);

                                setError("");

                                await loadVisitors();

                            }

                            catch (refreshError) {

                                handleApiError(
                                    refreshError,
                                    "Unable to refresh visitor requests."
                                );

                            }

                            finally {

                                setLoading(false);

                            }

                        }}
                    >
                        Refresh
                    </button>

                </section>


                {/* ALERTS */}

                {error && (

                    <div className="official-alert error">
                        {error}
                    </div>

                )}


                {message && (

                    <div className="official-alert success">
                        {message}
                    </div>

                )}


                {/* SUMMARY CARDS */}

                <section className="official-summary-grid">

                    <button
                        type="button"
                        className={`official-summary-card total ${
                            statusFilter === "ALL"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            setStatusFilter("ALL")
                        }
                    >

                        <span>
                            Total Requests
                        </span>

                        <strong>
                            {summary.total}
                        </strong>

                    </button>


                    <button
                        type="button"
                        className={`official-summary-card pending ${
                            statusFilter === "PENDING"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            setStatusFilter("PENDING")
                        }
                    >

                        <span>
                            Pending
                        </span>

                        <strong>
                            {summary.pending}
                        </strong>

                    </button>


                    <button
                        type="button"
                        className={`official-summary-card approved ${
                            statusFilter === "APPROVED"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            setStatusFilter("APPROVED")
                        }
                    >

                        <span>
                            Approved
                        </span>

                        <strong>
                            {summary.approved}
                        </strong>

                    </button>


                    <button
                        type="button"
                        className={`official-summary-card rejected ${
                            statusFilter === "REJECTED"
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            setStatusFilter("REJECTED")
                        }
                    >

                        <span>
                            Rejected
                        </span>

                        <strong>
                            {summary.rejected}
                        </strong>

                    </button>

                </section>


                {/* REQUEST LIST */}

                <section className="official-request-panel">

                    <div className="official-request-toolbar">

                        <div>

                            <h3>
                                {
                                    statusFilter === "ALL"
                                        ? "All Visitor Requests"
                                        : `${getStatusLabel(
                                            statusFilter
                                        )} Requests`
                                }
                            </h3>

                            <span>
                                {
                                    filteredVisitors.length
                                }
                                {" "}
                                record
                                {
                                    filteredVisitors.length === 1
                                        ? ""
                                        : "s"
                                }
                            </span>

                        </div>


                        <input
                            type="search"
                            className="official-search"
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                            placeholder="Search visitor, mobile or purpose..."
                        />

                    </div>


                    {filteredVisitors.length === 0 ? (

                        <div className="official-empty-state">

                            <div className="official-empty-icon">
                                ✓
                            </div>

                            <h3>
                                No visitor requests found
                            </h3>

                            <p>
                                There are no requests matching
                                the selected filter.
                            </p>

                        </div>

                    ) : (

                        <div className="official-request-list">

                            {filteredVisitors.map(
                                (visitor) => {

                                    const status =
                                        (
                                            visitor.approval_status ||
                                            "PENDING"
                                        ).toUpperCase();


                                    return (

                                        <article
                                            className="official-request-card"
                                            key={visitor.id}
                                        >

                                            <div className="official-visitor-photo">

                                                {visitor.photo_path ? (

                                                    <img
                                                        src={getPhotoUrl(
                                                            visitor.photo_path
                                                        )}
                                                        alt={
                                                            visitor.visitor_name
                                                        }
                                                        onClick={() =>
                                                            setSelectedPhoto(
                                                                getPhotoUrl(
                                                                    visitor.photo_path
                                                                )
                                                            )
                                                        }
                                                    />

                                                ) : (

                                                    <div className="official-no-photo">
                                                        {
                                                            visitor.visitor_name
                                                                ?.charAt(0)
                                                                .toUpperCase() ||
                                                            "V"
                                                        }
                                                    </div>

                                                )}

                                            </div>


                                            <div className="official-request-main">

                                                <div className="official-request-title">

                                                    <div>

                                                        <h4>
                                                            {
                                                                visitor.visitor_name
                                                            }
                                                        </h4>

                                                        <span>
                                                            Request #
                                                            {
                                                                visitor.id
                                                            }
                                                        </span>

                                                    </div>


                                                    <span
                                                        className={`official-status ${status.toLowerCase()}`}
                                                    >
                                                        {
                                                            getStatusLabel(
                                                                status
                                                            )
                                                        }
                                                    </span>

                                                </div>


                                                <div className="official-detail-grid">

                                                    <div>
                                                        <span>
                                                            Visit Date
                                                        </span>
                                                        <strong>
                                                            {
                                                                formatDate(
                                                                    visitor.visit_date
                                                                )
                                                            }
                                                        </strong>
                                                    </div>

                                                    <div>
                                                        <span>
                                                            Mobile
                                                        </span>
                                                        <strong>
                                                            {
                                                                visitor.mobile_number ||
                                                                "-"
                                                            }
                                                        </strong>
                                                    </div>

                                                    <div>
                                                        <span>
                                                            Purpose
                                                        </span>
                                                        <strong>
                                                            {
                                                                visitor.purpose_of_visit ||
                                                                "-"
                                                            }
                                                        </strong>
                                                    </div>

                                                    <div>
                                                        <span>
                                                            Address
                                                        </span>
                                                        <strong>
                                                            {
                                                                visitor.address ||
                                                                "-"
                                                            }
                                                        </strong>
                                                    </div>

                                                </div>


                                                {status === "REJECTED" && (

                                                    <div className="official-rejection-display">

                                                        <strong>
                                                            Rejection reason:
                                                        </strong>

                                                        {
                                                            visitor.rejection_reason ||
                                                            "-"
                                                        }

                                                    </div>

                                                )}


                                                {status !== "PENDING" &&
                                                    visitor.approval_time && (

                                                    <div className="official-decision-time">

                                                        Decision recorded:
                                                        {" "}
                                                        {
                                                            visitor.approval_time
                                                        }

                                                    </div>

                                                )}

                                            </div>


                                            {status === "PENDING" && (

    <div className="official-request-actions">

        <button
            type="button"
            className="official-approve-btn"
            disabled={
                actionLoading ===
                visitor.id
            }
            onClick={() =>
                handleApprove(
                    visitor
                )
            }
        >
            {
                actionLoading ===
                visitor.id
                    ? "Processing..."
                    : "Approve"
            }
        </button>

        <button
            type="button"
            className="official-reject-btn"
            disabled={
                actionLoading ===
                visitor.id
            }
            onClick={() =>
                openRejectPopup(
                    visitor
                )
            }
        >
            Reject
        </button>

    </div>

)}

                                        </article>

                                    );

                                }
                            )}

                        </div>

                    )}

                </section>

            </main>


            {/* REJECTION MODAL */}

            {rejectVisitor && (

                <div
                    className="official-modal-overlay"
                    onMouseDown={(event) => {

                        if (
                            event.target ===
                            event.currentTarget
                        ) {

                            closeRejectPopup();

                        }

                    }}
                >

                    <form
                        className="official-reject-modal"
                        onSubmit={handleReject}
                    >

                        <div className="official-modal-header">

                            <div>

                                <h3>
                                    Reject Visitor Request
                                </h3>

                                <p>
                                    Visitor:
                                    {" "}
                                    <strong>
                                        {
                                            rejectVisitor.visitor_name
                                        }
                                    </strong>
                                </p>

                            </div>


                            <button
                                type="button"
                                onClick={closeRejectPopup}
                                disabled={Boolean(
                                    actionLoading
                                )}
                            >
                                ×
                            </button>

                        </div>


                        <label htmlFor="rejectionReason">
                            Rejection reason
                        </label>


                        <textarea
                            id="rejectionReason"
                            value={rejectionReason}
                            onChange={(event) =>
                                setRejectionReason(
                                    event.target.value
                                )
                            }
                            placeholder="Enter the reason for rejecting this request..."
                            maxLength={500}
                            rows={5}
                            autoFocus
                        />


                        <div className="official-character-count">
                            {rejectionReason.length}/500
                        </div>


                        <div className="official-modal-actions">

                            <button
                                type="button"
                                className="official-modal-cancel"
                                onClick={closeRejectPopup}
                                disabled={Boolean(
                                    actionLoading
                                )}
                            >
                                Cancel
                            </button>


                            <button
                                type="submit"
                                className="official-modal-reject"
                                disabled={Boolean(
                                    actionLoading
                                )}
                            >
                                {
                                    actionLoading
                                        ? "Rejecting..."
                                        : "Confirm Rejection"
                                }
                            </button>

                        </div>

                    </form>

                </div>

            )}


            {/* PHOTO MODAL */}

            {selectedPhoto && (

                <div
                    className="official-photo-overlay"
                    onClick={() =>
                        setSelectedPhoto(null)
                    }
                >

                    <button
                        type="button"
                        onClick={() =>
                            setSelectedPhoto(null)
                        }
                    >
                        ×
                    </button>

                    <img
                        src={selectedPhoto}
                        alt="Visitor"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    />

                </div>

            )}

        </div>

    );

}


export default OfficialDashboard;
