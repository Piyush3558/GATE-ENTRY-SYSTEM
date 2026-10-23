import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";

import api from "../services/api";
import VisitorForm from "./VisitorForm";

import "./Dashboard.css";


function Dashboard() {

    // =====================================================
    // STATE
    // =====================================================

    const [visitors, setVisitors] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [search, setSearch] =
        useState("");

    const [error, setError] =
        useState("");

    const [actionLoading, setActionLoading] =
        useState(null);

    const [showVisitorForm, setShowVisitorForm] =
        useState(false);

    const [selectedPhoto, setSelectedPhoto] =
        useState(null);

    const [selectedVisitorId, setSelectedVisitorId] =
        useState(null);

    const [currentPage, setCurrentPage] =
        useState(1);


    const refreshInProgress =
        useRef(false);


    const recordsPerPage = 10;


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
    // LOAD VISITORS
    // =====================================================

    const loadVisitors = useCallback(
        async (silent = false) => {

            if (refreshInProgress.current) {
                return;
            }


            try {

                refreshInProgress.current =
                    true;


                if (!silent) {
                    setLoading(true);
                }


                const response =
                    await api.get(
                        "/visitors"
                    );


                setVisitors(
                    response.data.visitors ||
                    []
                );


                setError("");

            }

            catch (loadError) {

                console.error(
                    "Failed to load visitors:",
                    loadError
                );


                if (!silent) {

                    setError(
                        loadError.response?.data?.message ||
                        "Unable to load visitor records."
                    );

                }

            }

            finally {

                refreshInProgress.current =
                    false;


                if (!silent) {
                    setLoading(false);
                }

            }

        },
        []
    );


    // =====================================================
    // INITIAL LOAD AND AUTOMATIC REFRESH
    // =====================================================

    useEffect(() => {

        loadVisitors(false);


        const refreshInterval =
            window.setInterval(
                () => {

                    if (
                        document.visibilityState ===
                        "visible"
                    ) {

                        loadVisitors(true);

                    }

                },
                3000
            );


        const handleWindowFocus = () => {

            loadVisitors(true);

        };


        window.addEventListener(
            "focus",
            handleWindowFocus
        );


        return () => {

            window.clearInterval(
                refreshInterval
            );


            window.removeEventListener(
                "focus",
                handleWindowFocus
            );

        };

    }, [loadVisitors]);


    // =====================================================
    // CHECK IN
    // =====================================================

    const handleCheckIn = async (
        visitorId
    ) => {

        const confirmed =
            window.confirm(
                "Allow this approved visitor to enter?"
            );


        if (!confirmed) {
            return;
        }


        try {

            setActionLoading(
                visitorId
            );

            setError("");


            const response =
                await api.put(
                    `/visitors/${visitorId}/check-in`
                );


            setVisitors(previousVisitors =>

                previousVisitors.map(
                    visitor =>
                        visitor.id === visitorId
                            ? response.data.visitor
                            : visitor
                )

            );


            await loadVisitors(true);

        }

        catch (checkInError) {

            console.error(
                "Check-in error:",
                checkInError
            );


            alert(
                checkInError.response?.data?.message ||
                "Failed to check in visitor."
            );

        }

        finally {

            setActionLoading(null);

        }

    };


    // =====================================================
    // CHECK OUT
    // =====================================================

    const handleCheckout = async (
        visitorId
    ) => {

        const confirmed =
            window.confirm(
                "Are you sure you want to check out this visitor?"
            );


        if (!confirmed) {
            return;
        }


        try {

            setActionLoading(
                visitorId
            );

            setError("");


            const response =
                await api.put(
                    `/visitors/${visitorId}/checkout`
                );


            setVisitors(previousVisitors =>

                previousVisitors.map(
                    visitor =>
                        visitor.id === visitorId
                            ? response.data.visitor
                            : visitor
                )

            );


            await loadVisitors(true);

        }

        catch (checkoutError) {

            console.error(
                "Checkout error:",
                checkoutError
            );


            alert(
                checkoutError.response?.data?.message ||
                "Failed to check out visitor."
            );

        }

        finally {

            setActionLoading(null);

        }

    };


    // =====================================================
    // TODAY IN INDIA
    // =====================================================

    const getIndiaDate = () => {

        return new Intl.DateTimeFormat(
            "en-CA",
            {
                timeZone: "Asia/Kolkata",
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        ).format(
            new Date()
        );

    };


    const today =
        getIndiaDate();


    // =====================================================
    // DASHBOARD STATISTICS
    // =====================================================

    const todayVisitors =
        visitors.filter(
            visitor =>
                visitor.visit_date ===
                today
        );


    const currentlyInside =
        visitors.filter(
            visitor =>

                visitor.approval_status ===
                    "APPROVED" &&

                visitor.entry_status ===
                    "INSIDE"
        );


    const checkedOut =
        visitors.filter(
            visitor =>
                visitor.entry_status ===
                "CHECKED_OUT"
        );


    // =====================================================
    // SEARCH
    // =====================================================

    const filteredVisitors =
        useMemo(() => {

            const searchValue =
                search
                    .trim()
                    .toLowerCase();


            if (!searchValue) {
                return visitors;
            }


            return visitors.filter(
                visitor => {

                    return (

                        visitor.visitor_name
                            ?.toLowerCase()
                            .includes(searchValue) ||

                        visitor.mobile_number
                            ?.toLowerCase()
                            .includes(searchValue) ||

                        visitor.address
                            ?.toLowerCase()
                            .includes(searchValue) ||

                        visitor.purpose_of_visit
                            ?.toLowerCase()
                            .includes(searchValue) ||

                        visitor.official_to_visit
                            ?.toLowerCase()
                            .includes(searchValue) ||

                        visitor.department_name
                            ?.toLowerCase()
                            .includes(searchValue)

                    );

                }
            );

        }, [
            visitors,
            search
        ]);


    // =====================================================
    // PAGINATION
    // =====================================================

    useEffect(() => {

        setCurrentPage(1);
        setSelectedVisitorId(null);

    }, [search]);


    const totalPages =
        Math.max(
            1,
            Math.ceil(
                filteredVisitors.length /
                recordsPerPage
            )
        );


    useEffect(() => {

        if (
            currentPage >
            totalPages
        ) {

            setCurrentPage(
                totalPages
            );

        }

    }, [
        currentPage,
        totalPages
    ]);


    const startIndex =
        (
            currentPage - 1
        ) * recordsPerPage;


    const paginatedVisitors =
        filteredVisitors.slice(
            startIndex,
            startIndex +
                recordsPerPage
        );


    // =====================================================
    // SELECTED VISITOR
    // =====================================================

    const selectedVisitor =
        selectedVisitorId
            ? visitors.find(
                visitor =>
                    visitor.id ===
                    selectedVisitorId
            ) || null
            : null;


    // =====================================================
    // DATE FORMAT
    // =====================================================

    const formatDate = (dateValue) => {

        if (!dateValue) {
            return "-";
        }


        const dateOnly =
            String(dateValue)
                .split("T")[0];


        const parts =
            dateOnly.split("-");


        if (parts.length !== 3) {
            return dateValue;
        }


        return (
            `${parts[2]}-${parts[1]}-${parts[0]}`
        );

    };


    // =====================================================
    // TIME FORMAT
    // =====================================================

    const formatTime = (timeValue) => {

        if (!timeValue) {
            return "-";
        }


        const value =
            String(timeValue);


        const timePart =
            value.includes("T")
                ? value.split("T")[1]
                : value;


        const cleanTime =
            timePart
                .split(".")[0]
                .replace("Z", "");


        const parts =
            cleanTime.split(":");


        if (parts.length < 2) {
            return timeValue;
        }


        let hours =
            Number(parts[0]);

        const minutes =
            parts[1];


        if (Number.isNaN(hours)) {
            return timeValue;
        }


        const period =
            hours >= 12
                ? "PM"
                : "AM";


        hours =
            hours % 12 || 12;


        return (
            `${hours}:${minutes} ${period}`
        );

    };


    // =====================================================
    // APPROVAL / ENTRY STATUS
    // =====================================================

    const getApprovalStatus = (
        visitor
    ) => {

        return (
            visitor.approval_status ||
            "PENDING"
        ).toUpperCase();

    };


    const getEntryStatus = (
        visitor
    ) => {

        return (
            visitor.entry_status ||
            "WAITING"
        ).toUpperCase();

    };


    // =====================================================
    // COMPACT LIST STATUS
    // =====================================================

    const getDisplayStatus = (
        visitor
    ) => {

        const approvalStatus =
            getApprovalStatus(
                visitor
            );

        const entryStatus =
            getEntryStatus(
                visitor
            );


        if (
            entryStatus ===
            "CHECKED_OUT"
        ) {

            return {
                text: "Checked Out",
                className: "checked-out"
            };

        }


        if (
            entryStatus ===
            "INSIDE"
        ) {

            return {
                text: "Inside",
                className: "inside"
            };

        }


        if (
            approvalStatus ===
            "APPROVED"
        ) {

            return {
                text: "Approved",
                className: "approved"
            };

        }


        if (
            approvalStatus ===
            "REJECTED"
        ) {

            return {
                text: "Rejected",
                className: "rejected"
            };

        }


        return {
            text: "Pending",
            className: "pending"
        };

    };


    // =====================================================
    // GATE ACTION
    // =====================================================

    const renderGateAction = (
        visitor
    ) => {

        const approvalStatus =
            getApprovalStatus(
                visitor
            );

        const entryStatus =
            getEntryStatus(
                visitor
            );

        const isProcessing =
            actionLoading ===
            visitor.id;


        if (
            entryStatus ===
            "CHECKED_OUT"
        ) {

            return (
                <span className="status out">
                    Checked Out
                </span>
            );

        }


        if (
            approvalStatus ===
            "PENDING"
        ) {

            return (
                <span className="status pending">
                    Waiting for Approval
                </span>
            );

        }


        if (
            approvalStatus ===
            "REJECTED"
        ) {

            return (
                <span className="status rejected">
                    Rejected
                </span>
            );

        }


        if (
            approvalStatus ===
                "APPROVED" &&
            entryStatus ===
                "WAITING"
        ) {

            return (

                <button
                    type="button"
                    className="checkin-button"
                    disabled={
                        isProcessing
                    }
                    onClick={() =>
                        handleCheckIn(
                            visitor.id
                        )
                    }
                >
                    {
                        isProcessing
                            ? "Checking In..."
                            : "Check In"
                    }
                </button>

            );

        }


        if (
            approvalStatus ===
                "APPROVED" &&
            entryStatus ===
                "INSIDE"
        ) {

            return (

                <button
                    type="button"
                    className="checkout-button"
                    disabled={
                        isProcessing
                    }
                    onClick={() =>
                        handleCheckout(
                            visitor.id
                        )
                    }
                >
                    {
                        isProcessing
                            ? "Checking Out..."
                            : "Check Out"
                    }
                </button>

            );

        }


        return "-";

    };


    // =====================================================
    // VISITOR SAVED
    // =====================================================

    const handleVisitorSaved =
        async () => {

            await loadVisitors(true);

        };


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="dashboard">


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="dashboard-header">

                <div>

                    <h1>
                        Dashboard
                    </h1>

                    <p>
                        Monitor visitor approvals,
                        entries and exits.
                    </p>

                </div>


                <button
                    type="button"
                    className="new-visitor-btn"
                    onClick={() =>
                        setShowVisitorForm(true)
                    }
                >
                    + New Visitor
                </button>

            </div>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

                <div className="error-message">
                    {error}
                </div>

            )}


            {/* =================================================
                STATISTICS
            ================================================= */}

            <div className="stats-grid">

                <div className="stat-card">

                    <div className="stat-title">
                        Today&apos;s Visitors
                    </div>

                    <div className="stat-value">
                        {todayVisitors.length}
                    </div>

                </div>


                <div className="stat-card">

                    <div className="stat-title">
                        Currently Inside
                    </div>

                    <div className="stat-value">
                        {currentlyInside.length}
                    </div>

                </div>


                <div className="stat-card">

                    <div className="stat-title">
                        Checked Out
                    </div>

                    <div className="stat-value">
                        {checkedOut.length}
                    </div>

                </div>

            </div>


            {/* =================================================
                VISITOR SECTION
            ================================================= */}

            <section className="visitor-section">

                <div className="visitor-section-header">

                    <div>

                        <h2>
                            Recent Visitors
                        </h2>

                        <p>
                            Tap a visitor on tablet
                            to view complete details.
                        </p>

                    </div>


                    <input
                        type="search"
                        className="search-input"
                        value={search}
                        onChange={event =>
                            setSearch(
                                event.target.value
                            )
                        }
                        placeholder="Search visitors..."
                    />

                </div>


                {loading ? (

                    <div className="dashboard-loading">
                        Loading visitor records...
                    </div>

                ) : filteredVisitors.length === 0 ? (

                    <div className="dashboard-empty">
                        No visitor records found.
                    </div>

                ) : (

                    <>

                        {/* =========================================
                            DESKTOP TABLE
                        ========================================= */}

                        <div className="desktop-visitor-table">

                            <div className="table-container">

                                <table>

                                    <thead>

                                        <tr>

                                            <th>S.No</th>

                                            <th>Photo</th>

                                            <th>Date</th>

                                            <th>Visitor</th>

                                            <th>Mobile</th>

                                            <th>Purpose</th>

                                            <th>Official</th>

                                            <th>Approval</th>

                                            <th>Time In</th>

                                            <th>Time Out</th>

                                            <th>
                                                Gate Action
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody>

                                        {paginatedVisitors.map(
                                            (
                                                visitor,
                                                index
                                            ) => {

                                                const approvalStatus =
                                                    getApprovalStatus(
                                                        visitor
                                                    );


                                                return (

                                                    <tr
                                                        key={
                                                            visitor.id
                                                        }
                                                    >

                                                        <td>
                                                            {
                                                                startIndex +
                                                                index +
                                                                1
                                                            }
                                                        </td>


                                                        <td>

                                                            {
                                                                visitor.photo_path
                                                                    ? (

                                                                        <img
                                                                            src={
                                                                                getPhotoUrl(
                                                                                    visitor.photo_path
                                                                                )
                                                                            }
                                                                            alt={
                                                                                visitor.visitor_name
                                                                            }
                                                                            className="visitor-thumbnail"
                                                                            onClick={() =>
                                                                                setSelectedPhoto(
                                                                                    getPhotoUrl(
                                                                                        visitor.photo_path
                                                                                    )
                                                                                )
                                                                            }
                                                                        />

                                                                    ) : (

                                                                        <div className="no-photo">
                                                                            No Photo
                                                                        </div>

                                                                    )
                                                            }

                                                        </td>


                                                        <td>
                                                            {
                                                                formatDate(
                                                                    visitor.visit_date
                                                                )
                                                            }
                                                        </td>


                                                        <td>

                                                            <strong>
                                                                {
                                                                    visitor.visitor_name
                                                                }
                                                            </strong>

                                                            <div className="visitor-secondary">
                                                                {
                                                                    visitor.address ||
                                                                    "-"
                                                                }
                                                            </div>

                                                        </td>


                                                        <td>
                                                            {
                                                                visitor.mobile_number ||
                                                                "-"
                                                            }
                                                        </td>


                                                        <td>
                                                            {
                                                                visitor.purpose_of_visit ||
                                                                "-"
                                                            }
                                                        </td>


                                                        <td>

                                                            {
                                                                visitor.official_to_visit ||
                                                                "-"
                                                            }

                                                            <div className="visitor-secondary">
                                                                {
                                                                    visitor.department_name ||
                                                                    ""
                                                                }
                                                            </div>

                                                        </td>


                                                        <td>

                                                            <span
                                                                className={`approval-status ${approvalStatus.toLowerCase()}`}
                                                            >
                                                                {
                                                                    approvalStatus ===
                                                                    "APPROVED"
                                                                        ? "Approved"
                                                                        : approvalStatus ===
                                                                            "REJECTED"
                                                                            ? "Rejected"
                                                                            : "Pending"
                                                                }
                                                            </span>

                                                        </td>


                                                        <td>
                                                            {
                                                                formatTime(
                                                                    visitor.time_in
                                                                )
                                                            }
                                                        </td>


                                                        <td>
                                                            {
                                                                formatTime(
                                                                    visitor.time_out
                                                                )
                                                            }
                                                        </td>


                                                        <td>
                                                            {
                                                                renderGateAction(
                                                                    visitor
                                                                )
                                                            }
                                                        </td>

                                                    </tr>

                                                );

                                            }
                                        )}

                                    </tbody>

                                </table>

                            </div>

                        </div>


                        {/* =========================================
                            TABLET / MOBILE VIEW
                        ========================================= */}

                        <div className="tablet-visitor-view">


                            {!selectedVisitor ? (

                                <div className="compact-visitor-list">

                                    {paginatedVisitors.map(
                                        (
                                            visitor,
                                            index
                                        ) => {

                                            const displayStatus =
                                                getDisplayStatus(
                                                    visitor
                                                );


                                            return (

                                                <button
                                                    type="button"
                                                    className="compact-visitor-row"
                                                    key={
                                                        visitor.id
                                                    }
                                                    onClick={() =>
                                                        setSelectedVisitorId(
                                                            visitor.id
                                                        )
                                                    }
                                                >

                                                    <div className="compact-number">
                                                        {
                                                            startIndex +
                                                            index +
                                                            1
                                                        }
                                                    </div>


                                                    <div className="compact-photo">

                                                        {
                                                            visitor.photo_path
                                                                ? (

                                                                    <img
                                                                        src={
                                                                            getPhotoUrl(
                                                                                visitor.photo_path
                                                                            )
                                                                        }
                                                                        alt={
                                                                            visitor.visitor_name
                                                                        }
                                                                    />

                                                                ) : (

                                                                    <div className="compact-photo-placeholder">
                                                                        {
                                                                            visitor.visitor_name
                                                                                ?.charAt(0)
                                                                                ?.toUpperCase() ||
                                                                            "V"
                                                                        }
                                                                    </div>

                                                                )
                                                        }

                                                    </div>


                                                    <div className="compact-main">

                                                        <div className="compact-name">
                                                            {
                                                                visitor.visitor_name ||
                                                                "-"
                                                            }
                                                        </div>


                                                        <div className="compact-meta">

                                                            <span>
                                                                {
                                                                    formatDate(
                                                                        visitor.visit_date
                                                                    )
                                                                }
                                                            </span>

                                                            <span className="compact-dot">
                                                                •
                                                            </span>

                                                            <span>
                                                                {
                                                                    formatTime(
                                                                        visitor.time_in
                                                                    )
                                                                }
                                                            </span>

                                                        </div>


                                                        <div className="compact-official">

                                                            <span>
                                                                To:
                                                            </span>

                                                            {
                                                                visitor.official_to_visit ||
                                                                "-"
                                                            }

                                                        </div>

                                                    </div>


                                                    <div className="compact-right">

                                                        <span
                                                            className={`compact-status ${displayStatus.className}`}
                                                        >
                                                            {
                                                                displayStatus.text
                                                            }
                                                        </span>


                                                        <span className="compact-arrow">
                                                            ›
                                                        </span>

                                                    </div>

                                                </button>

                                            );

                                        }
                                    )}

                                </div>

                            ) : (

                                /* =================================
                                   SELECTED VISITOR DETAILS
                                ================================= */

                                <div className="tablet-visitor-detail">


                                    <div className="detail-topbar">

                                        <button
                                            type="button"
                                            className="detail-back-button"
                                            onClick={() =>
                                                setSelectedVisitorId(
                                                    null
                                                )
                                            }
                                        >
                                            ← Back
                                        </button>


                                        <span
                                            className={`compact-status ${
                                                getDisplayStatus(
                                                    selectedVisitor
                                                ).className
                                            }`}
                                        >
                                            {
                                                getDisplayStatus(
                                                    selectedVisitor
                                                ).text
                                            }
                                        </span>

                                    </div>


                                    <div className="detail-profile">

                                        <div className="detail-photo-wrapper">

                                            {
                                                selectedVisitor.photo_path
                                                    ? (

                                                        <img
                                                            src={
                                                                getPhotoUrl(
                                                                    selectedVisitor.photo_path
                                                                )
                                                            }
                                                            alt={
                                                                selectedVisitor.visitor_name
                                                            }
                                                            className="detail-photo"
                                                            onClick={() =>
                                                                setSelectedPhoto(
                                                                    getPhotoUrl(
                                                                        selectedVisitor.photo_path
                                                                    )
                                                                )
                                                            }
                                                        />

                                                    ) : (

                                                        <div className="detail-photo-placeholder">
                                                            {
                                                                selectedVisitor.visitor_name
                                                                    ?.charAt(0)
                                                                    ?.toUpperCase() ||
                                                                "V"
                                                            }
                                                        </div>

                                                    )
                                            }

                                        </div>


                                        <div className="detail-profile-info">

                                            <h3>
                                                {
                                                    selectedVisitor.visitor_name ||
                                                    "-"
                                                }
                                            </h3>


                                            <p>
                                                {
                                                    selectedVisitor.mobile_number ||
                                                    "No mobile number"
                                                }
                                            </p>


                                            <span>
                                                Visitor ID #
                                                {
                                                    selectedVisitor.id
                                                }
                                            </span>

                                        </div>

                                    </div>


                                    <div className="detail-section">

                                        <h4>
                                            Visit Information
                                        </h4>


                                        <div className="detail-grid">

                                            <div className="detail-item">

                                                <span>
                                                    Date
                                                </span>

                                                <strong>
                                                    {
                                                        formatDate(
                                                            selectedVisitor.visit_date
                                                        )
                                                    }
                                                </strong>

                                            </div>


                                            <div className="detail-item">

                                                <span>
                                                    Purpose
                                                </span>

                                                <strong>
                                                    {
                                                        selectedVisitor.purpose_of_visit ||
                                                        "-"
                                                    }
                                                </strong>

                                            </div>


                                            <div className="detail-item detail-full">

                                                <span>
                                                    Address
                                                </span>

                                                <strong>
                                                    {
                                                        selectedVisitor.address ||
                                                        "-"
                                                    }
                                                </strong>

                                            </div>

                                        </div>

                                    </div>


                                    <div className="detail-section">

                                        <h4>
                                            Official Information
                                        </h4>


                                        <div className="detail-grid">

                                            <div className="detail-item">

                                                <span>
                                                    Department
                                                </span>

                                                <strong>
                                                    {
                                                        selectedVisitor.department_name ||
                                                        "-"
                                                    }
                                                </strong>

                                            </div>


                                            <div className="detail-item">

                                                <span>
                                                    Official
                                                </span>

                                                <strong>
                                                    {
                                                        selectedVisitor.official_to_visit ||
                                                        "-"
                                                    }
                                                </strong>

                                            </div>

                                        </div>

                                    </div>


                                    <div className="detail-section">

                                        <h4>
                                            Gate Status
                                        </h4>


                                        <div className="detail-grid">

                                            <div className="detail-item">

                                                <span>
                                                    Approval
                                                </span>

                                                <strong>

                                                    <span
                                                        className={`approval-status ${getApprovalStatus(
                                                            selectedVisitor
                                                        ).toLowerCase()}`}
                                                    >
                                                        {
                                                            getApprovalStatus(
                                                                selectedVisitor
                                                            ) ===
                                                            "APPROVED"
                                                                ? "Approved"
                                                                : getApprovalStatus(
                                                                    selectedVisitor
                                                                ) ===
                                                                    "REJECTED"
                                                                    ? "Rejected"
                                                                    : "Pending"
                                                        }
                                                    </span>

                                                </strong>

                                            </div>


                                            <div className="detail-item">

                                                <span>
                                                    Entry Status
                                                </span>

                                                <strong>
                                                    {
                                                        getEntryStatus(
                                                            selectedVisitor
                                                        )
                                                    }
                                                </strong>

                                            </div>


                                            <div className="detail-item">

                                                <span>
                                                    Time In
                                                </span>

                                                <strong>
                                                    {
                                                        formatTime(
                                                            selectedVisitor.time_in
                                                        )
                                                    }
                                                </strong>

                                            </div>


                                            <div className="detail-item">

                                                <span>
                                                    Time Out
                                                </span>

                                                <strong>
                                                    {
                                                        formatTime(
                                                            selectedVisitor.time_out
                                                        )
                                                    }
                                                </strong>

                                            </div>

                                        </div>

                                    </div>


                                    {
                                        selectedVisitor.rejection_reason && (

                                            <div className="rejection-box">

                                                <span>
                                                    Rejection Reason
                                                </span>

                                                <strong>
                                                    {
                                                        selectedVisitor.rejection_reason
                                                    }
                                                </strong>

                                            </div>

                                        )
                                    }


                                    <div className="detail-action-area">

                                        {
                                            renderGateAction(
                                                selectedVisitor
                                            )
                                        }

                                    </div>

                                </div>

                            )}

                        </div>


                        {/* =========================================
                            PAGINATION
                        ========================================= */}

                        <div className="pagination-container">

                            <div className="pagination-info">

                                Showing{" "}

                                {
                                    filteredVisitors.length
                                        ? startIndex + 1
                                        : 0
                                }

                                {" - "}

                                {
                                    Math.min(
                                        startIndex +
                                            recordsPerPage,
                                        filteredVisitors.length
                                    )
                                }

                                {" of "}

                                {
                                    filteredVisitors.length
                                }

                            </div>


                            <div className="pagination-buttons">

                                <button
                                    type="button"
                                    disabled={
                                        currentPage === 1
                                    }
                                    onClick={() => {

                                        setSelectedVisitorId(
                                            null
                                        );

                                        setCurrentPage(
                                            previous =>
                                                previous - 1
                                        );

                                    }}
                                >
                                    Previous
                                </button>


                                <span>
                                    Page{" "}
                                    {currentPage}
                                    {" "}of{" "}
                                    {totalPages}
                                </span>


                                <button
                                    type="button"
                                    disabled={
                                        currentPage ===
                                        totalPages
                                    }
                                    onClick={() => {

                                        setSelectedVisitorId(
                                            null
                                        );

                                        setCurrentPage(
                                            previous =>
                                                previous + 1
                                        );

                                    }}
                                >
                                    Next
                                </button>

                            </div>

                        </div>

                    </>

                )}

            </section>


            {/* =================================================
                VISITOR FORM
            ================================================= */}

            {showVisitorForm && (

                <VisitorForm
                    onClose={() =>
                        setShowVisitorForm(false)
                    }
                    onSaved={
                        handleVisitorSaved
                    }
                />

            )}


            {/* =================================================
                PHOTO POPUP
            ================================================= */}

            {selectedPhoto && (

                <div
                    className="photo-modal-overlay"
                    onClick={() =>
                        setSelectedPhoto(null)
                    }
                >

                    <div
                        className="photo-modal"
                        onClick={event =>
                            event.stopPropagation()
                        }
                    >

                        <button
                            type="button"
                            className="photo-modal-close"
                            onClick={() =>
                                setSelectedPhoto(null)
                            }
                        >
                            ×
                        </button>


                        <img
                            className="photo-modal-image"
                            src={selectedPhoto}
                            alt="Visitor"
                        />

                    </div>

                </div>

            )}

        </div>

    );

}


export default Dashboard;