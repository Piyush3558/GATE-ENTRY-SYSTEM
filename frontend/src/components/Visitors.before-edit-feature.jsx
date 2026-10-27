import {
    useEffect,
    useMemo,
    useState
} from "react";

import * as XLSX from "xlsx";

import api from "../services/api";

import "./Visitors.css";


function Visitors() {

    // =====================================================
    // VISITOR DATA
    // =====================================================

    const [visitors, setVisitors] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [dateFilter, setDateFilter] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState("all");

    const [selectedPhoto, setSelectedPhoto] =
        useState(null);


    // =====================================================
    // TABLET SELECTED VISITOR
    // =====================================================

    const [selectedVisitorId, setSelectedVisitorId] =
        useState(null);


    // =====================================================
    // EXPORT POPUP
    // =====================================================

    const [showExportPopup, setShowExportPopup] =
        useState(false);

    const [exportFromDate, setExportFromDate] =
        useState("");

    const [exportToDate, setExportToDate] =
        useState("");


    // =====================================================
    // PAGINATION
    // =====================================================

    const [currentPage, setCurrentPage] =
        useState(1);

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


        let baseURL =
            api.defaults?.baseURL || "";


        baseURL =
            baseURL.replace(
                /\/api\/?$/,
                ""
            );


        baseURL =
            baseURL.replace(
                /\/$/,
                ""
            );


        if (!photoPath.startsWith("/")) {

            photoPath =
                `/${photoPath}`;

        }


        return `${baseURL}${photoPath}`;

    };


    // =====================================================
    // LOAD VISITORS
    // =====================================================

    const loadVisitors = async () => {

        try {

            setLoading(true);

            setError("");


            const response =
                await api.get(
                    "/visitors"
                );


            setVisitors(
                response.data.visitors ||
                []
            );

        }

        catch (loadError) {

            console.error(
                "Failed to load visitors:",
                loadError
            );


            console.error(
                "SERVER RESPONSE:",
                loadError.response?.data
            );


            setError(
                loadError.response?.data?.message ||
                "Unable to load visitor records."
            );

        }

        finally {

            setLoading(false);

        }

    };


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        loadVisitors();

    }, []);


    // =====================================================
    // APPROVAL STATUS
    // =====================================================

    const getApprovalStatus = (
        visitor
    ) => {

        return (
            visitor.approval_status ||
            "PENDING"
        ).toUpperCase();

    };


    // =====================================================
    // ENTRY STATUS
    // =====================================================

    const getEntryStatus = (
        visitor
    ) => {

        if (
            visitor.entry_status
        ) {

            return visitor.entry_status
                .toUpperCase();

        }


        // Fallback for old records

        if (
            visitor.time_out
        ) {

            return "CHECKED_OUT";

        }


        return "INSIDE";

    };


    // =====================================================
    // APPROVAL LABEL
    // =====================================================

    const getApprovalLabel = (
        status
    ) => {

        switch (status) {

            case "APPROVED":
                return "Approved";

            case "REJECTED":
                return "Rejected";

            case "PENDING":
            default:
                return "Pending";

        }

    };


    // =====================================================
    // ENTRY STATUS LABEL
    // =====================================================

    const getEntryStatusLabel = (
        status
    ) => {

        switch (status) {

            case "WAITING":
                return "Waiting";

            case "INSIDE":
                return "Currently Inside";

            case "CHECKED_OUT":
                return "Checked Out";

            case "PENDING":
                return "Pending";

            default:
                return status || "-";

        }

    };


    // =====================================================
    // COMPACT STATUS
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
                label: "Checked Out",
                className: "checked-out"
            };

        }


        if (
            entryStatus ===
            "INSIDE" &&
            approvalStatus ===
            "APPROVED"
        ) {

            return {
                label: "Inside",
                className: "inside"
            };

        }


        if (
            approvalStatus ===
            "APPROVED"
        ) {

            return {
                label: "Approved",
                className: "approved"
            };

        }


        if (
            approvalStatus ===
            "REJECTED"
        ) {

            return {
                label: "Rejected",
                className: "rejected"
            };

        }


        return {
            label: "Pending",
            className: "pending"
        };

    };


    // =====================================================
    // FILTER VISITORS
    // =====================================================

    const filteredVisitors =
        useMemo(() => {

            return visitors.filter(
                (visitor) => {

                    // SEARCH

                    const searchValue =
                        search
                            .trim()
                            .toLowerCase();


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

                        visitor.address
                            ?.toLowerCase()
                            .includes(
                                searchValue
                            ) ||

                        visitor.purpose_of_visit
                            ?.toLowerCase()
                            .includes(
                                searchValue
                            ) ||

                        visitor.official_to_visit
                            ?.toLowerCase()
                            .includes(
                                searchValue
                            ) ||

                        visitor.official_email
                            ?.toLowerCase()
                            .includes(
                                searchValue
                            );


                    // DATE

                    const matchesDate =
                        !dateFilter ||

                        visitor.visit_date ===
                        dateFilter;


                    // STATUS

                    let matchesStatus =
                        true;


                    if (
                        statusFilter ===
                        "pending"
                    ) {

                        matchesStatus =
                            getApprovalStatus(
                                visitor
                            ) ===
                            "PENDING";

                    }


                    if (
                        statusFilter ===
                        "approved"
                    ) {

                        matchesStatus =
                            getApprovalStatus(
                                visitor
                            ) ===
                            "APPROVED";

                    }


                    if (
                        statusFilter ===
                        "rejected"
                    ) {

                        matchesStatus =
                            getApprovalStatus(
                                visitor
                            ) ===
                            "REJECTED";

                    }


                    if (
                        statusFilter ===
                        "inside"
                    ) {

                        matchesStatus =

                            getApprovalStatus(
                                visitor
                            ) ===
                                "APPROVED" &&

                            getEntryStatus(
                                visitor
                            ) ===
                                "INSIDE";

                    }


                    if (
                        statusFilter ===
                        "checked_out"
                    ) {

                        matchesStatus =
                            getEntryStatus(
                                visitor
                            ) ===
                            "CHECKED_OUT";

                    }


                    return (
                        matchesSearch &&
                        matchesDate &&
                        matchesStatus
                    );

                }
            );

        }, [
            visitors,
            search,
            dateFilter,
            statusFilter
        ]);


    // =====================================================
    // PAGINATION
    // =====================================================

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                filteredVisitors.length /
                recordsPerPage
            )
        );


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
    // RESET PAGE WHEN FILTER CHANGES
    // =====================================================

    useEffect(() => {

        setCurrentPage(1);

        setSelectedVisitorId(
            null
        );

    }, [
        search,
        dateFilter,
        statusFilter
    ]);


    // =====================================================
    // PROTECT PAGE NUMBER
    // =====================================================

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

    const formatDate = (
        date
    ) => {

        if (!date) {
            return "-";
        }


        const dateOnly =
            String(date)
                .split("T")[0];


        const parts =
            dateOnly.split("-");


        if (
            parts.length !== 3
        ) {

            return date;

        }


        return (
            `${parts[2]}-${parts[1]}-${parts[0]}`
        );

    };


    // =====================================================
    // TIME FORMAT
    // =====================================================

    const formatTime = (
        time
    ) => {

        if (!time) {
            return "-";
        }


        const value =
            String(time);


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


        if (
            parts.length < 2
        ) {

            return time;

        }


        let hours =
            Number(
                parts[0]
            );

        const minutes =
            parts[1];


        if (
            Number.isNaN(
                hours
            )
        ) {

            return time;

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
    // OPEN EXPORT POPUP
    // =====================================================

    const openExportPopup = () => {

        const today =
            new Date()
                .toISOString()
                .split("T")[0];


        setExportFromDate(
            today
        );

        setExportToDate(
            today
        );

        setShowExportPopup(
            true
        );

    };


    // =====================================================
    // EXPORT VISITORS TO EXCEL
    // =====================================================

    const exportVisitorsToExcel =
        () => {

            if (
                !exportFromDate &&
                !exportToDate
            ) {

                alert(
                    "Please select an export date or date range."
                );

                return;

            }


            const fromDate =
                exportFromDate ||
                exportToDate;


            const toDate =
                exportToDate ||
                exportFromDate;


            if (
                fromDate > toDate
            ) {

                alert(
                    "From Date cannot be later than To Date."
                );

                return;

            }


            const exportVisitors =
                visitors.filter(
                    visitor => {

                        if (
                            !visitor.visit_date
                        ) {

                            return false;

                        }


                        const visitorDate =
                            String(
                                visitor.visit_date
                            ).split("T")[0];


                        return (
                            visitorDate >=
                                fromDate &&

                            visitorDate <=
                                toDate
                        );

                    }
                );


            if (
                exportVisitors.length ===
                0
            ) {

                if (
                    fromDate ===
                    toDate
                ) {

                    alert(
                        `No visitor records found for ${formatDate(
                            fromDate
                        )}`
                    );

                }

                else {

                    alert(
                        `No visitor records found from ${formatDate(
                            fromDate
                        )} to ${formatDate(
                            toDate
                        )}`
                    );

                }


                return;

            }


            const excelData =
                exportVisitors.map(
                    (
                        visitor,
                        index
                    ) => {

                        const approvalStatus =
                            getApprovalStatus(
                                visitor
                            );


                        const entryStatus =
                            getEntryStatus(
                                visitor
                            );


                        return {

                            "S.No":
                                index + 1,

                            "Date":
                                formatDate(
                                    visitor.visit_date
                                ),

                            "Visitor Name":
                                visitor.visitor_name ||
                                "",

                            "Address":
                                visitor.address ||
                                "",

                            "Mobile Number":
                                visitor.mobile_number ||
                                "",

                            "Purpose of Visit":
                                visitor.purpose_of_visit ||
                                "",

                            "Department":
                                visitor.department_name ||
                                "",

                            "Official to Visit":
                                visitor.official_to_visit ||
                                "",

                            "Official Employee ID":
                                visitor.official_employee_id ||
                                "",

                            "Official Email":
                                visitor.official_email ||
                                "",

                            "Approval Status":
                                getApprovalLabel(
                                    approvalStatus
                                ),

                            "Rejection Reason":
                                visitor.rejection_reason ||
                                "",

                            "Approval Time":
                                visitor.approval_time ||
                                "",

                            "Time In":
                                visitor.time_in ||
                                "",

                            "Time Out":
                                visitor.time_out ||
                                "",

                            "Entry Status":
                                getEntryStatusLabel(
                                    entryStatus
                                )

                        };

                    }
                );


            const worksheet =
                XLSX.utils.json_to_sheet(
                    excelData
                );


            worksheet["!cols"] = [

                { wch: 8 },
                { wch: 14 },
                { wch: 22 },
                { wch: 30 },
                { wch: 16 },
                { wch: 25 },
                { wch: 20 },
                { wch: 25 },
                { wch: 20 },
                { wch: 30 },
                { wch: 18 },
                { wch: 30 },
                { wch: 25 },
                { wch: 15 },
                { wch: 15 },
                { wch: 20 }

            ];


            const workbook =
                XLSX.utils.book_new();


            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "Visitors"
            );


            let fileName;


            if (
                fromDate ===
                toDate
            ) {

                fileName =
                    `Visitors_${fromDate}.xlsx`;

            }

            else {

                fileName =
                    `Visitors_${fromDate}_to_${toDate}.xlsx`;

            }


            XLSX.writeFile(
                workbook,
                fileName
            );


            setShowExportPopup(
                false
            );

        };


    // =====================================================
    // RENDER APPROVAL STATUS
    // =====================================================

    const renderApprovalStatus = (
        visitor
    ) => {

        const status =
            getApprovalStatus(
                visitor
            );


        if (
            status ===
            "APPROVED"
        ) {

            return (
                <span className="status approved">
                    Approved
                </span>
            );

        }


        if (
            status ===
            "REJECTED"
        ) {

            return (
                <span
                    className="status rejected"
                    title={
                        visitor.rejection_reason ||
                        ""
                    }
                >
                    Rejected
                </span>
            );

        }


        return (
            <span className="status pending">
                Pending
            </span>
        );

    };


    // =====================================================
    // RENDER ENTRY STATUS
    // =====================================================

    const renderEntryStatus = (
        visitor
    ) => {

        const status =
            getEntryStatus(
                visitor
            );


        if (
            status ===
            "INSIDE"
        ) {

            return (
                <span className="status inside">
                    Currently Inside
                </span>
            );

        }


        if (
            status ===
            "CHECKED_OUT"
        ) {

            return (
                <span className="status out">
                    Checked Out
                </span>
            );

        }


        if (
            status ===
            "WAITING"
        ) {

            return (
                <span className="status pending">
                    Waiting
                </span>
            );

        }


        return (
            <span className="status">
                {
                    getEntryStatusLabel(
                        status
                    )
                }
            </span>
        );

    };


    // =====================================================
    // RETURN
    // =====================================================

    return (

        <div className="visitors-page">


            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="visitors-header">

                <div>

                    <h1>
                        Visitors
                    </h1>

                    <p>
                        Manage all visitor entries
                    </p>

                </div>


                <button
                    type="button"
                    className="export-button"
                    onClick={
                        openExportPopup
                    }
                >
                    Export
                </button>

            </div>


            {/* =================================================
                ERROR
            ================================================= */}

            {error && (

                <div className="visitors-error">
                    {error}
                </div>

            )}


            {/* =================================================
                FILTER BAR
            ================================================= */}

            <div className="filter-bar">


                <div className="filter-group search-group">

                    <label>
                        Search
                    </label>

                    <input
                        type="text"
                        placeholder="Name, mobile, official, email..."
                        value={search}
                        onChange={e =>
                            setSearch(
                                e.target.value
                            )
                        }
                    />

                </div>


                <div className="filter-group">

                    <label>
                        Date
                    </label>

                    <input
                        type="date"
                        value={
                            dateFilter
                        }
                        onChange={e =>
                            setDateFilter(
                                e.target.value
                            )
                        }
                    />

                </div>


                <div className="filter-group">

                    <label>
                        Status
                    </label>

                    <select
                        value={
                            statusFilter
                        }
                        onChange={e =>
                            setStatusFilter(
                                e.target.value
                            )
                        }
                    >

                        <option value="all">
                            All
                        </option>

                        <option value="pending">
                            Pending Approval
                        </option>

                        <option value="approved">
                            Approved
                        </option>

                        <option value="rejected">
                            Rejected
                        </option>

                        <option value="inside">
                            Currently Inside
                        </option>

                        <option value="checked_out">
                            Checked Out
                        </option>

                    </select>

                </div>


                <button
                    type="button"
                    className="clear-filter-button"
                    onClick={() => {

                        setSearch("");

                        setDateFilter("");

                        setStatusFilter(
                            "all"
                        );

                        setSelectedVisitorId(
                            null
                        );

                    }}
                >
                    Clear
                </button>

            </div>


            {/* =================================================
                VISITOR CARD
            ================================================= */}

            <div className="visitors-card">


                <div className="visitors-card-header">

                    <div>

                        <h2>
                            Visitor Register
                        </h2>

                        <span>

                            {
                                filteredVisitors.length
                            }

                            {" "}

                            record
                            {
                                filteredVisitors.length !==
                                1
                                    ? "s"
                                    : ""
                            }

                        </span>

                    </div>

                </div>


                {loading ? (

                    <div className="visitors-loading">
                        Loading visitors...
                    </div>

                ) : filteredVisitors.length ===
                    0 ? (

                    <div className="visitors-empty">
                        No visitor records found.
                    </div>

                ) : (

                    <>


                        {/* =========================================
                            DESKTOP TABLE
                        ========================================= */}

                        <div className="visitors-desktop-view">

                            <div className="visitors-table-container">

                                <table className="visitors-table">

                                    <thead>

                                        <tr>

                                            <th>S.No</th>
                                            <th>Photo</th>
                                            <th>Date</th>
                                            <th>Visitor</th>
                                            <th>Address</th>
                                            <th>Mobile</th>
                                            <th>Purpose</th>
                                            <th>Official</th>
                                            <th>Official Email</th>
                                            <th>Approval</th>
                                            <th>Time In</th>
                                            <th>Time Out</th>
                                            <th>Entry Status</th>

                                        </tr>

                                    </thead>


                                    <tbody>

                                        {
                                            paginatedVisitors.map(
                                                (
                                                    visitor,
                                                    index
                                                ) => (

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
                                                                                visitor.visitor_name ||
                                                                                "Visitor"
                                                                            }
                                                                            className="visitor-thumbnail"
                                                                            onClick={() =>
                                                                                setSelectedPhoto(
                                                                                    getPhotoUrl(
                                                                                        visitor.photo_path
                                                                                    )
                                                                                )
                                                                            }
                                                                            onError={e => {

                                                                                e.currentTarget.style.display =
                                                                                    "none";

                                                                            }}
                                                                        />

                                                                    ) : (

                                                                        <div className="visitor-no-photo">
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
                                                                    visitor.visitor_name ||
                                                                    "-"
                                                                }
                                                            </strong>
                                                        </td>


                                                        <td>
                                                            {
                                                                visitor.address ||
                                                                "-"
                                                            }
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

                                                            {
                                                                visitor.department_name && (

                                                                    <div className="visitor-secondary">
                                                                        {
                                                                            visitor.department_name
                                                                        }
                                                                    </div>

                                                                )
                                                            }

                                                        </td>


                                                        <td>
                                                            {
                                                                visitor.official_email ||
                                                                "-"
                                                            }
                                                        </td>


                                                        <td>
                                                            {
                                                                renderApprovalStatus(
                                                                    visitor
                                                                )
                                                            }
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
                                                                renderEntryStatus(
                                                                    visitor
                                                                )
                                                            }
                                                        </td>

                                                    </tr>

                                                )
                                            )
                                        }

                                    </tbody>

                                </table>

                            </div>

                        </div>


                        {/* =========================================
                            TABLET / MOBILE VIEW
                        ========================================= */}

                        <div className="visitors-tablet-view">


                            {!selectedVisitor ? (

                                <div className="visitor-compact-list">

                                    {
                                        paginatedVisitors.map(
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
                                                        className="visitor-compact-row"
                                                        key={
                                                            visitor.id
                                                        }
                                                        onClick={() =>
                                                            setSelectedVisitorId(
                                                                visitor.id
                                                            )
                                                        }
                                                    >

                                                        <div className="visitor-list-number">
                                                            {
                                                                startIndex +
                                                                index +
                                                                1
                                                            }
                                                        </div>


                                                        <div className="visitor-list-photo">

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
                                                                                visitor.visitor_name ||
                                                                                "Visitor"
                                                                            }
                                                                        />

                                                                    ) : (

                                                                        <div className="visitor-list-placeholder">

                                                                            {
                                                                                visitor.visitor_name
                                                                                    ?.charAt(
                                                                                        0
                                                                                    )
                                                                                    ?.toUpperCase() ||
                                                                                "V"
                                                                            }

                                                                        </div>

                                                                    )
                                                            }

                                                        </div>


                                                        <div className="visitor-list-main">

                                                            <strong>
                                                                {
                                                                    visitor.visitor_name ||
                                                                    "-"
                                                                }
                                                            </strong>


                                                            <div className="visitor-list-meta">

                                                                <span>
                                                                    {
                                                                        formatDate(
                                                                            visitor.visit_date
                                                                        )
                                                                    }
                                                                </span>

                                                                <span>
                                                                    •
                                                                </span>

                                                                <span>
                                                                    {
                                                                        visitor.mobile_number ||
                                                                        "No mobile"
                                                                    }
                                                                </span>

                                                            </div>


                                                            <div className="visitor-list-official">

                                                                <span>
                                                                    To:
                                                                </span>

                                                                {
                                                                    visitor.official_to_visit ||
                                                                    "-"
                                                                }

                                                            </div>

                                                        </div>


                                                        <div className="visitor-list-right">

                                                            <span
                                                                className={`visitor-list-status ${displayStatus.className}`}
                                                            >
                                                                {
                                                                    displayStatus.label
                                                                }
                                                            </span>


                                                            <span className="visitor-list-arrow">
                                                                ›
                                                            </span>

                                                        </div>

                                                    </button>

                                                );

                                            }
                                        )
                                    }

                                </div>

                            ) : (

                                /* =================================
                                   VISITOR DETAIL
                                ================================= */

                                <div className="visitor-detail-view">


                                    <div className="visitor-detail-topbar">

                                        <button
                                            type="button"
                                            className="visitor-detail-back"
                                            onClick={() =>
                                                setSelectedVisitorId(
                                                    null
                                                )
                                            }
                                        >
                                            ← Back to Visitors
                                        </button>


                                        <span
                                            className={`visitor-list-status ${
                                                getDisplayStatus(
                                                    selectedVisitor
                                                ).className
                                            }`}
                                        >
                                            {
                                                getDisplayStatus(
                                                    selectedVisitor
                                                ).label
                                            }
                                        </span>

                                    </div>


                                    {/* PROFILE */}

                                    <div className="visitor-detail-profile">


                                        <div className="visitor-detail-photo-wrapper">

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
                                                                selectedVisitor.visitor_name ||
                                                                "Visitor"
                                                            }
                                                            className="visitor-detail-photo"
                                                            onClick={() =>
                                                                setSelectedPhoto(
                                                                    getPhotoUrl(
                                                                        selectedVisitor.photo_path
                                                                    )
                                                                )
                                                            }
                                                        />

                                                    ) : (

                                                        <div className="visitor-detail-photo-placeholder">

                                                            {
                                                                selectedVisitor.visitor_name
                                                                    ?.charAt(
                                                                        0
                                                                    )
                                                                    ?.toUpperCase() ||
                                                                "V"
                                                            }

                                                        </div>

                                                    )
                                            }

                                        </div>


                                        <div className="visitor-detail-profile-info">

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


                                    {/* VISIT INFORMATION */}

                                    <div className="visitor-detail-section">

                                        <h4>
                                            Visit Information
                                        </h4>


                                        <div className="visitor-detail-grid">

                                            <div className="visitor-detail-item">

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


                                            <div className="visitor-detail-item">

                                                <span>
                                                    Mobile
                                                </span>

                                                <strong>
                                                    {
                                                        selectedVisitor.mobile_number ||
                                                        "-"
                                                    }
                                                </strong>

                                            </div>


                                            <div className="visitor-detail-item">

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


                                            <div className="visitor-detail-item visitor-detail-full">

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


                                    {/* OFFICIAL INFORMATION */}

                                    <div className="visitor-detail-section">

                                        <h4>
                                            Official Information
                                        </h4>


                                        <div className="visitor-detail-grid">

                                            <div className="visitor-detail-item">

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


                                            <div className="visitor-detail-item">

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


                                            <div className="visitor-detail-item visitor-detail-full">

                                                <span>
                                                    Official Email
                                                </span>

                                                <strong>
                                                    {
                                                        selectedVisitor.official_email ||
                                                        "-"
                                                    }
                                                </strong>

                                            </div>

                                        </div>

                                    </div>


                                    {/* STATUS INFORMATION */}

                                    <div className="visitor-detail-section">

                                        <h4>
                                            Status Information
                                        </h4>


                                        <div className="visitor-detail-grid">

                                            <div className="visitor-detail-item">

                                                <span>
                                                    Approval
                                                </span>

                                                <strong>
                                                    {
                                                        renderApprovalStatus(
                                                            selectedVisitor
                                                        )
                                                    }
                                                </strong>

                                            </div>


                                            <div className="visitor-detail-item">

                                                <span>
                                                    Entry Status
                                                </span>

                                                <strong>
                                                    {
                                                        renderEntryStatus(
                                                            selectedVisitor
                                                        )
                                                    }
                                                </strong>

                                            </div>


                                            <div className="visitor-detail-item">

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


                                            <div className="visitor-detail-item">

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


                                    {/* REJECTION */}

                                    {
                                        selectedVisitor.rejection_reason && (

                                            <div className="visitor-rejection-box">

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

                                </div>

                            )}

                        </div>


                        {/* =========================================
                            PAGINATION
                        ========================================= */}

                        {totalPages > 1 && (

                            <div className="pagination">

                                <button
                                    type="button"
                                    disabled={
                                        currentPage ===
                                        1
                                    }
                                    onClick={() => {

                                        setSelectedVisitorId(
                                            null
                                        );

                                        setCurrentPage(
                                            currentPage - 1
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
                                            currentPage + 1
                                        );

                                    }}
                                >
                                    Next
                                </button>

                            </div>

                        )}

                    </>

                )}

            </div>


            {/* =================================================
                EXPORT DATE RANGE POPUP
            ================================================= */}

            {showExportPopup && (

                <div
                    className="export-modal-overlay"
                    onClick={() =>
                        setShowExportPopup(
                            false
                        )
                    }
                >

                    <div
                        className="export-modal"
                        onClick={e =>
                            e.stopPropagation()
                        }
                    >

                        <div className="export-modal-header">

                            <div>

                                <h2>
                                    Export Visitors
                                </h2>

                                <p>
                                    Select the date or date range you want to export.
                                </p>

                            </div>


                            <button
                                type="button"
                                className="export-close-button"
                                onClick={() =>
                                    setShowExportPopup(
                                        false
                                    )
                                }
                            >
                                ×
                            </button>

                        </div>


                        <div className="export-modal-body">


                            <div className="export-date-group">

                                <label>
                                    From Date
                                </label>

                                <input
                                    type="date"
                                    value={
                                        exportFromDate
                                    }
                                    onChange={e =>
                                        setExportFromDate(
                                            e.target.value
                                        )
                                    }
                                />

                            </div>


                            <div className="export-date-group">

                                <label>
                                    To Date
                                </label>

                                <input
                                    type="date"
                                    value={
                                        exportToDate
                                    }
                                    onChange={e =>
                                        setExportToDate(
                                            e.target.value
                                        )
                                    }
                                />

                            </div>


                            <p className="export-helper-text">
                                Select the same date for both fields to export one day.
                            </p>

                        </div>


                        <div className="export-modal-actions">

                            <button
                                type="button"
                                className="export-cancel-button"
                                onClick={() =>
                                    setShowExportPopup(
                                        false
                                    )
                                }
                            >
                                Cancel
                            </button>


                            <button
                                type="button"
                                className="export-confirm-button"
                                onClick={
                                    exportVisitorsToExcel
                                }
                            >
                                Export Excel
                            </button>

                        </div>

                    </div>

                </div>

            )}


            {/* =================================================
                PHOTO POPUP
            ================================================= */}

            {selectedPhoto && (

                <div
                    className="photo-modal-overlay"
                    onClick={() =>
                        setSelectedPhoto(
                            null
                        )
                    }
                >

                    <div
                        className="photo-modal"
                        onClick={e =>
                            e.stopPropagation()
                        }
                    >

                        <button
                            type="button"
                            className="photo-modal-close"
                            onClick={() =>
                                setSelectedPhoto(
                                    null
                                )
                            }
                        >
                            ×
                        </button>


                        <img
                            src={
                                selectedPhoto
                            }
                            alt="Visitor"
                            className="photo-modal-image"
                        />

                    </div>

                </div>

            )}

        </div>

    );

}


export default Visitors;