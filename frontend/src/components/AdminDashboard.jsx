import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";

import {
    useNavigate
} from "react-router-dom";

import * as XLSX from "xlsx";

import api from "../services/api";

import "./AdminDashboard.css";


function AdminDashboard() {

    const navigate =
        useNavigate();


    // =====================================================
    // AUTHENTICATED ADMIN
    // =====================================================

    const adminUser =
        useMemo(() => {

            try {

                const savedUser =
                    localStorage.getItem(
                        "authUser"
                    );


                return savedUser
                    ? JSON.parse(savedUser)
                    : null;

            }

            catch (error) {

                console.error(
                    "Unable to read Admin session:",
                    error
                );


                return null;

            }

        }, []);


    // =====================================================
    // STATE
    // =====================================================

    const [summary, setSummary] =
        useState({
            total_visitors: 0,
            today_visitors: 0,
            pending_approval: 0,
            approved: 0,
            rejected: 0,
            waiting: 0,
            currently_inside: 0,
            checked_out: 0
        });

    const [
        departmentSummary,
        setDepartmentSummary
    ] = useState([]);

    const [visitors, setVisitors] =
        useState([]);

    const [departments, setDepartments] =
        useState([]);

    const [officials, setOfficials] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [silentRefreshing, setSilentRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const [selectedVisitor, setSelectedVisitor] =
        useState(null);

    const [selectedPhoto, setSelectedPhoto] =
        useState(null);


    // =====================================================
    // FILTER STATE
    // =====================================================

    const [search, setSearch] =
        useState("");

    const [fromDate, setFromDate] =
        useState("");

    const [toDate, setToDate] =
        useState("");

    const [approvalStatus, setApprovalStatus] =
        useState("ALL");

    const [entryStatus, setEntryStatus] =
        useState("ALL");

    const [departmentId, setDepartmentId] =
        useState("");

    const [
        officialEmployeeId,
        setOfficialEmployeeId
    ] = useState("");


    // =====================================================
    // PAGINATION
    // =====================================================

    const [currentPage, setCurrentPage] =
        useState(1);

    const [totalRecords, setTotalRecords] =
        useState(0);

    const [totalPages, setTotalPages] =
        useState(1);

    const recordsPerPage = 20;


    const requestInProgress =
        useRef(false);


    // =====================================================
    // AUTHORIZATION
    // =====================================================

    const getToken = () => {

        return localStorage.getItem(
            "authToken"
        );

    };


    const getAuthConfig = () => {

        return {

            headers: {

                Authorization:
                    `Bearer ${getToken()}`

            }

        };

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


        navigate(
            "/login",
            {
                replace: true
            }
        );

    };


    // =====================================================
    // API ERROR
    // =====================================================

    const handleApiError = (
        apiError,
        fallbackMessage,
        silent = false
    ) => {

        console.error(
            fallbackMessage,
            apiError
        );


        if (
            apiError.response?.status === 401 ||
            apiError.response?.status === 403
        ) {

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

            return;

        }


        if (!silent) {

            setError(
                apiError.response?.data?.message ||
                fallbackMessage
            );

        }

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
    // QUERY PARAMETERS
    // =====================================================

    const createVisitorParameters =
        useCallback(() => {

            const parameters =
                new URLSearchParams();


            parameters.set(
                "page",
                String(currentPage)
            );

            parameters.set(
                "limit",
                String(recordsPerPage)
            );


            if (search.trim()) {

                parameters.set(
                    "search",
                    search.trim()
                );

            }


            if (fromDate) {

                parameters.set(
                    "from_date",
                    fromDate
                );

            }


            if (toDate) {

                parameters.set(
                    "to_date",
                    toDate
                );

            }


            if (
                approvalStatus !== "ALL"
            ) {

                parameters.set(
                    "approval_status",
                    approvalStatus
                );

            }


            if (
                entryStatus !== "ALL"
            ) {

                parameters.set(
                    "entry_status",
                    entryStatus
                );

            }


            if (departmentId) {

                parameters.set(
                    "department_id",
                    departmentId
                );

            }


            if (officialEmployeeId) {

                parameters.set(
                    "official_employee_id",
                    officialEmployeeId
                );

            }


            return parameters;

        }, [
            currentPage,
            search,
            fromDate,
            toDate,
            approvalStatus,
            entryStatus,
            departmentId,
            officialEmployeeId
        ]);


    // =====================================================
    // LOAD ADMIN DASHBOARD
    // =====================================================

    const loadDashboard =
        useCallback(async () => {

            const response =
                await api.get(
                    "/admin/dashboard",
                    getAuthConfig()
                );


            setSummary(
                response.data.summary || {}
            );


            setDepartmentSummary(
                response.data
                    .department_summary || []
            );

        }, []);


    // =====================================================
    // LOAD FILTER OPTIONS
    // =====================================================

    const loadFilterOptions =
        useCallback(async () => {

            const response =
                await api.get(
                    "/admin/visitors/filter-options",
                    getAuthConfig()
                );


            setDepartments(
                response.data.departments || []
            );


            setOfficials(
                response.data.officials || []
            );

        }, []);


    // =====================================================
    // LOAD VISITORS
    // =====================================================

    const loadVisitors =
        useCallback(async (
            silent = false
        ) => {

            if (
                requestInProgress.current
            ) {
                return;
            }


            try {

                requestInProgress.current =
                    true;


                if (silent) {

                    setSilentRefreshing(true);

                }


                const parameters =
                    createVisitorParameters();


                const response =
                    await api.get(
                        `/admin/visitors?${parameters.toString()}`,
                        getAuthConfig()
                    );


                setVisitors(
                    response.data.visitors || []
                );


                setTotalRecords(
                    Number(
                        response.data.total
                    ) || 0
                );


                setTotalPages(
                    Number(
                        response.data.pagination
                            ?.total_pages
                    ) || 1
                );


                setError("");

            }

            catch (loadError) {

                handleApiError(
                    loadError,
                    "Unable to load visitor records.",
                    silent
                );

            }

            finally {

                requestInProgress.current =
                    false;

                setSilentRefreshing(false);

            }

        }, [
            createVisitorParameters
        ]);


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    useEffect(() => {

        const initialize =
            async () => {

                try {

                    setLoading(true);

                    setError("");


                    await Promise.all([
                        loadDashboard(),
                        loadFilterOptions()
                    ]);


                    await loadVisitors();

                }

                catch (initializationError) {

                    handleApiError(
                        initializationError,
                        "Unable to load the Admin Portal."
                    );

                }

                finally {

                    setLoading(false);

                }

            };


        initialize();

    }, []);


    // =====================================================
    // RELOAD WHEN FILTER OR PAGE CHANGES
    // =====================================================

    useEffect(() => {

        if (loading) {
            return;
        }


        const filterDelay =
            window.setTimeout(
                () => {

                    loadVisitors();

                },
                350
            );


        return () => {

            window.clearTimeout(
                filterDelay
            );

        };

    }, [
        currentPage,
        search,
        fromDate,
        toDate,
        approvalStatus,
        entryStatus,
        departmentId,
        officialEmployeeId
    ]);


    // =====================================================
    // AUTOMATIC REFRESH
    // =====================================================

    useEffect(() => {

        const refreshInterval =
            window.setInterval(
                async () => {

                    if (
                        document.visibilityState !==
                        "visible"
                    ) {
                        return;
                    }


                    await Promise.all([
                        loadDashboard(),
                        loadVisitors(true)
                    ]);

                },
                10000
            );


        return () => {

            window.clearInterval(
                refreshInterval
            );

        };

    }, [
        loadDashboard,
        loadVisitors
    ]);


    // =====================================================
    // RESET PAGE WHEN FILTER CHANGES
    // =====================================================

    useEffect(() => {

        setCurrentPage(1);

    }, [
        search,
        fromDate,
        toDate,
        approvalStatus,
        entryStatus,
        departmentId,
        officialEmployeeId
    ]);


    // =====================================================
    // CLEAR FILTERS
    // =====================================================

    const clearFilters = () => {

        setSearch("");
        setFromDate("");
        setToDate("");
        setApprovalStatus("ALL");
        setEntryStatus("ALL");
        setDepartmentId("");
        setOfficialEmployeeId("");
        setCurrentPage(1);

    };


    // =====================================================
    // VISITOR DETAILS
    // =====================================================

    const openVisitorDetails =
        async visitorId => {

            try {

                setError("");


                const response =
                    await api.get(
                        `/admin/visitors/${visitorId}`,
                        getAuthConfig()
                    );


                setSelectedVisitor(
                    response.data.visitor
                );

            }

            catch (detailError) {

                handleApiError(
                    detailError,
                    "Unable to load visitor details."
                );

            }

        };


    // =====================================================
    // DATE FORMAT
    // =====================================================

    const formatDate = dateValue => {

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
    // EXCEL EXPORT
    // =====================================================

    const exportToExcel = () => {

        if (
            visitors.length === 0
        ) {

            alert(
                "There are no visitor records to export."
            );

            return;

        }


        const rows =
            visitors.map(
                (
                    visitor,
                    index
                ) => ({

                    "S.No":
                        (
                            currentPage - 1
                        ) * recordsPerPage +
                        index +
                        1,

                    "Visitor ID":
                        visitor.id,

                    "Visit Date":
                        formatDate(
                            visitor.visit_date
                        ),

                    "Visitor Name":
                        visitor.visitor_name || "",

                    "Address":
                        visitor.address || "",

                    "Mobile Number":
                        visitor.mobile_number || "",

                    "Purpose":
                        visitor.purpose_of_visit || "",

                    "Department":
                        visitor.department_name || "",

                    "Official Name":
                        visitor.official_name ||
                        visitor.official_to_visit ||
                        "",

                    "Official Code":
                        visitor.official_code || "",

                    "Official Email":
                        visitor.official_email || "",

                    "Unit":
                        visitor.official_unit || "",

                    "Approval Status":
                        visitor.approval_status || "",

                    "Approval Time":
                        visitor.approval_time || "",

                    "Rejection Reason":
                        visitor.rejection_reason || "",

                    "Entry Status":
                        visitor.entry_status || "",

                    "Time In":
                        visitor.time_in || "",

                    "Time Out":
                        visitor.time_out || ""

                })
            );


        const worksheet =
            XLSX.utils.json_to_sheet(
                rows
            );


        worksheet["!cols"] = [
            { wch: 8 },
            { wch: 12 },
            { wch: 14 },
            { wch: 22 },
            { wch: 28 },
            { wch: 17 },
            { wch: 25 },
            { wch: 23 },
            { wch: 25 },
            { wch: 17 },
            { wch: 30 },
            { wch: 18 },
            { wch: 18 },
            { wch: 22 },
            { wch: 28 },
            { wch: 18 },
            { wch: 14 },
            { wch: 14 }
        ];


        const workbook =
            XLSX.utils.book_new();


        XLSX.utils.book_append_sheet(
            workbook,
            worksheet,
            "Admin Visitors"
        );


        const today =
            new Date()
                .toISOString()
                .split("T")[0];


        XLSX.writeFile(
            workbook,
            `Admin_Visitors_${today}.xlsx`
        );

    };


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (

            <div className="admin-loading-page">

                <div className="admin-loading-spinner" />

                <h2>
                    Loading Admin Portal
                </h2>

                <p>
                    Preparing visitor information...
                </p>

            </div>

        );

    }


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="admin-dashboard-page">


            {/* HEADER */}

          {/*  <header className="admin-header">

                <div className="admin-brand">

                    <div className="admin-brand-icon">
                        G
                    </div>

                    <div>

                        <strong>
                            Gate Entry
                        </strong>

                        <span>
                            Administration Portal
                        </span>

                    </div>

                </div>

               


                <div className="admin-header-user">

                    <div>

                        <strong>
                            {
                                adminUser?.name ||
                                "System Administrator"
                            }
                        </strong>

                        <span>
                            Administrator
                        </span>

                    </div>


                    <div className="admin-avatar">
                        A
                    </div>


                    <button
                        type="button"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>

                </div>

            </header>*/}


            {/* CONTENT */}

            <main className="admin-content">


                {/* PAGE TITLE */}

                <div className="admin-page-heading">

                    <div>

                        <span>
                            MANAGEMENT OVERVIEW
                        </span>

                        <h1>
                            Admin Dashboard
                        </h1>

                        <p>
                            Monitor every visitor request,
                            approval, entry and exit.
                        </p>

                    </div>


                    <div className="admin-heading-actions">

                        {silentRefreshing && (
                            <span>
                                Updating...
                            </span>
                        )}


                        <button
                            type="button"
                            className="admin-export-button"
                            onClick={exportToExcel}
                        >
                            Export Current Page
                        </button>

                    </div>

                </div>


                {/* ERROR */}

                {error && (

                    <div className="admin-error">
                        {error}
                    </div>

                )}


                {/* SUMMARY */}

             {/*   <section className="admin-summary-grid">

                    <div className="admin-summary-card blue">
                        <span>Total Visitors</span>
                        <strong>
                            {summary.total_visitors || 0}
                        </strong>
                    </div>

                    <div className="admin-summary-card purple">
                        <span>Today</span>
                        <strong>
                            {summary.today_visitors || 0}
                        </strong>
                    </div>

                    <div className="admin-summary-card amber">
                        <span>Pending</span>
                        <strong>
                            {summary.pending_approval || 0}
                        </strong>
                    </div>

                    <div className="admin-summary-card green">
                        <span>Approved</span>
                        <strong>
                            {summary.approved || 0}
                        </strong>
                    </div>

                    <div className="admin-summary-card red">
                        <span>Rejected</span>
                        <strong>
                            {summary.rejected || 0}
                        </strong>
                    </div>

                    <div className="admin-summary-card teal">
                        <span>Currently Inside</span>
                        <strong>
                            {summary.currently_inside || 0}
                        </strong>
                    </div>

                    <div className="admin-summary-card gray">
                        <span>Checked Out</span>
                        <strong>
                            {summary.checked_out || 0}
                        </strong>
                    </div>

                </section> */}


                {/* DEPARTMENT SUMMARY */}

              {/*  {departmentSummary.length > 0 && (

                    <section className="admin-department-panel">

                        <div className="admin-panel-title">

                            <h2>
                                Department Summary
                            </h2>

                            <span>
                                Visitor requests by department
                            </span>

                        </div>


                        <div className="admin-department-list">

                            {departmentSummary.map(
                                department => (

                                    <button
                                        type="button"
                                        key={
                                            department.department_id
                                        }
                                        onClick={() =>
                                            setDepartmentId(
                                                String(
                                                    department.department_id
                                                )
                                            )
                                        }
                                    >

                                        <strong>
                                            {
                                                department.department_name
                                            }
                                        </strong>

                                        <span>
                                            {
                                                department.total_visitors
                                            }
                                            {" "}
                                            visitors
                                        </span>

                                    </button>

                                )
                            )}

                        </div>

                    </section>

                )}
*/}

                {/* FILTERS */}

                <section className="admin-filter-panel">

                    <div className="admin-filter-grid">

                        <div className="admin-filter-field admin-filter-search">

                            <label>
                                Search
                            </label>

                            <input
                                type="search"
                                value={search}
                                onChange={event =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                                placeholder="Visitor, mobile, official, department..."
                            />

                        </div>


                        <div className="admin-filter-field">

                            <label>
                                From Date
                            </label>

                            <input
                                type="date"
                                value={fromDate}
                                onChange={event =>
                                    setFromDate(
                                        event.target.value
                                    )
                                }
                            />

                        </div>


                        <div className="admin-filter-field">

                            <label>
                                To Date
                            </label>

                            <input
                                type="date"
                                value={toDate}
                                onChange={event =>
                                    setToDate(
                                        event.target.value
                                    )
                                }
                            />

                        </div>


                        <div className="admin-filter-field">

                            <label>
                                Approval
                            </label>

                            <select
                                value={approvalStatus}
                                onChange={event =>
                                    setApprovalStatus(
                                        event.target.value
                                    )
                                }
                            >
                                <option value="ALL">
                                    All
                                </option>
                                <option value="PENDING">
                                    Pending
                                </option>
                                <option value="APPROVED">
                                    Approved
                                </option>
                                <option value="REJECTED">
                                    Rejected
                                </option>
                            </select>

                        </div>


                        <div className="admin-filter-field">

                            <label>
                                Entry Status
                            </label>

                            <select
                                value={entryStatus}
                                onChange={event =>
                                    setEntryStatus(
                                        event.target.value
                                    )
                                }
                            >
                                <option value="ALL">
                                    All
                                </option>
                                <option value="WAITING">
                                    Waiting
                                </option>
                                <option value="INSIDE">
                                    Inside
                                </option>
                                <option value="CHECKED_OUT">
                                    Checked Out
                                </option>
                            </select>

                        </div>


                        <div className="admin-filter-field">

                            <label>
                                Department
                            </label>

                            <select
                                value={departmentId}
                                onChange={event =>
                                    setDepartmentId(
                                        event.target.value
                                    )
                                }
                            >
                                <option value="">
                                    All Departments
                                </option>

                                {departments.map(
                                    department => (

                                        <option
                                            key={department.id}
                                            value={department.id}
                                        >
                                            {
                                                department.department_name
                                            }
                                        </option>

                                    )
                                )}
                            </select>

                        </div>


                        <div className="admin-filter-field">

                            <label>
                                Official
                            </label>

                            <select
                                value={officialEmployeeId}
                                onChange={event =>
                                    setOfficialEmployeeId(
                                        event.target.value
                                    )
                                }
                            >
                                <option value="">
                                    All Officials
                                </option>

                                {officials.map(
                                    official => (

                                        <option
                                            key={official.id}
                                            value={official.id}
                                        >
                                            {
                                                official.employee_name
                                            }
                                        </option>

                                    )
                                )}
                            </select>

                        </div>


                        <button
                            type="button"
                            className="admin-clear-filter"
                            onClick={clearFilters}
                        >
                            Clear Filters
                        </button>

                    </div>

                </section>


                {/* VISITOR TABLE */}

                <section className="admin-visitor-panel">

                    <div className="admin-panel-title admin-visitor-title">

                        <div>

                            <h2>
                                All Visitor Records
                            </h2>

                            <span>
                                {totalRecords} total records
                            </span>

                        </div>

                    </div>


                    {visitors.length === 0 ? (

                        <div className="admin-empty-state">

                            <h3>
                                No visitor records found
                            </h3>

                            <p>
                                Change or clear the selected filters.
                            </p>

                        </div>

                    ) : (

                        <div className="admin-table-container">

                            <table>

                                <thead>

                                    <tr>
                                        <th>Photo</th>
                                        <th>Visitor</th>
                                        <th>Contact</th>
                                        <th>Details</th>
                                    </tr>

                                </thead>


                                <tbody>

                                    {visitors.map(
                                        visitor => (

                                            <tr key={visitor.id}>

                                                <td>

                                                    {visitor.photo_path ? (

                                                        <img
                                                            src={
                                                                getPhotoUrl(
                                                                    visitor.photo_path
                                                                )
                                                            }
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
                                                        <span>No Photo</span>
                                                    )}

                                                </td>

                                                <td>
                                                    <strong>
                                                        {
                                                            visitor.visitor_name
                                                        }
                                                    </strong>
                                                </td>

                                                <td>
                                                    <strong>
                                                        {
                                                            visitor.mobile_number ||
                                                            "-"
                                                        }
                                                    </strong>
                                                </td>

                                                <td>
                                                    <button
                                                        type="button"
                                                        className="admin-view-details-button"
                                                        onClick={() =>
                                                            openVisitorDetails(
                                                                visitor.id
                                                            )
                                                        }
                                                    >
                                                        View details
                                                    </button>
                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}


                    {/* PAGINATION */}

                    <div className="admin-pagination">

                        <span>
                            Page {currentPage} of {totalPages}
                        </span>


                        <div>

                            <button
                                type="button"
                                disabled={
                                    currentPage === 1
                                }
                                onClick={() =>
                                    setCurrentPage(
                                        previous =>
                                            previous - 1
                                    )
                                }
                            >
                                Previous
                            </button>


                            <button
                                type="button"
                                disabled={
                                    currentPage ===
                                    totalPages
                                }
                                onClick={() =>
                                    setCurrentPage(
                                        previous =>
                                            previous + 1
                                    )
                                }
                            >
                                Next
                            </button>

                        </div>

                    </div>

                </section>

            </main>


            {/* VISITOR DETAIL MODAL */}

            {selectedVisitor && (

                <div
                    className="admin-modal-overlay"
                    onMouseDown={event => {

                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            setSelectedVisitor(null);
                        }

                    }}
                >

                    <div className="admin-detail-modal">

                        <div className="admin-detail-header">

                            <div>
                                <h2>
                                    Visitor Details
                                </h2>
                                <span>
                                    Record #{selectedVisitor.id}
                                </span>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setSelectedVisitor(null)
                                }
                            >
                                ×
                            </button>

                        </div>


                        <div className="admin-detail-content">

                            {selectedVisitor.photo_path && (

                                <img
                                    className="admin-detail-photo"
                                    src={
                                        getPhotoUrl(
                                            selectedVisitor.photo_path
                                        )
                                    }
                                    alt={
                                        selectedVisitor.visitor_name
                                    }
                                />

                            )}


                            <div className="admin-detail-grid">

                                <div>
                                    <span>Visitor Name</span>
                                    <strong>
                                        {selectedVisitor.visitor_name || "-"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Visit Date</span>
                                    <strong>
                                        {formatDate(selectedVisitor.visit_date)}
                                    </strong>
                                </div>

                                <div>
                                    <span>Mobile</span>
                                    <strong>
                                        {selectedVisitor.mobile_number || "-"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Address</span>
                                    <strong>
                                        {selectedVisitor.address || "-"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Purpose</span>
                                    <strong>
                                        {selectedVisitor.purpose_of_visit || "-"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Department</span>
                                    <strong>
                                        {selectedVisitor.department_name || "-"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Official</span>
                                    <strong>
                                        {selectedVisitor.official_name || "-"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Official Code</span>
                                    <strong>
                                        {selectedVisitor.official_code || "-"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Official Email</span>
                                    <strong>
                                        {selectedVisitor.official_email || "-"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Unit</span>
                                    <strong>
                                        {selectedVisitor.official_unit || "-"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Approval Status</span>
                                    <strong>
                                        {selectedVisitor.approval_status || "-"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Approval Time</span>
                                    <strong>
                                        {selectedVisitor.approval_time || "-"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Entry Status</span>
                                    <strong>
                                        {selectedVisitor.entry_status || "-"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Time In</span>
                                    <strong>
                                        {selectedVisitor.time_in || "-"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Time Out</span>
                                    <strong>
                                        {selectedVisitor.time_out || "-"}
                                    </strong>
                                </div>

                                <div>
                                    <span>Rejection Reason</span>
                                    <strong>
                                        {selectedVisitor.rejection_reason || "-"}
                                    </strong>
                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            )}


            {/* PHOTO MODAL */}

            {selectedPhoto && (

                <div
                    className="admin-photo-overlay"
                    onClick={() =>
                        setSelectedPhoto(null)
                    }
                >
                    <img
                        src={selectedPhoto}
                        alt="Visitor"
                        onClick={event =>
                            event.stopPropagation()
                        }
                    />
                </div>

            )}

        </div>

    );

}


export default AdminDashboard;
