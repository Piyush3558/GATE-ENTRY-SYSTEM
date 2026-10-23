import {
    useCallback,
    useEffect,
    useState
} from "react";

import { useNavigate } from "react-router-dom";

import api from "../services/api";

import "./AdminEmployeeAccess.css";


function AdminEmployeeAccess() {

    const navigate = useNavigate();

    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [departmentId, setDepartmentId] = useState("");
    const [employeeStatus, setEmployeeStatus] = useState("ALL");
    const [accountStatus, setAccountStatus] = useState("ALL");

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const recordsPerPage = 20;


    // =====================================================
    // CREATE LOGIN STATE
    // =====================================================

    const [selectedEmployee, setSelectedEmployee] =
        useState(null);

    const [temporaryPassword, setTemporaryPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [showCreatePassword, setShowCreatePassword] =
        useState(false);

    const [creatingAccount, setCreatingAccount] =
        useState(false);

    const [createAccountError, setCreateAccountError] =
        useState("");


    // =====================================================
    // MANAGE ACCOUNT STATE
    // =====================================================

    const [managedEmployee, setManagedEmployee] =
        useState(null);

    const [resetPassword, setResetPassword] =
        useState("");

    const [confirmResetPassword, setConfirmResetPassword] =
        useState("");

    const [showResetPassword, setShowResetPassword] =
        useState(false);

    const [managingAccount, setManagingAccount] =
        useState(false);

    const [manageAccountError, setManageAccountError] =
        useState("");


    // =====================================================
    // ADD / EDIT EMPLOYEE STATE
    // =====================================================

    const [employeeFormOpen, setEmployeeFormOpen] =
        useState(false);

    const [employeeForm, setEmployeeForm] =
        useState({
            employee_code: "",
            employee_name: "",
            department_id: "",
            email: "",
            unit: "UFI BAWAL"
        });

    const [savingEmployee, setSavingEmployee] =
        useState(false);

    const [employeeFormError, setEmployeeFormError] =
        useState("");


    // =====================================================
    // AUTHORIZATION
    // =====================================================

    const getAuthConfig = () => {

        const token =
            localStorage.getItem("authToken");

        return {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };

    };


    // =====================================================
    // SESSION FAILURE
    // =====================================================

    const clearSessionAndLogin = () => {

        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");

        navigate(
            "/login",
            { replace: true }
        );

    };


    // =====================================================
    // API ERROR
    // =====================================================

    const handleApiError = (
        requestError,
        fallbackMessage
    ) => {

        console.error(
            fallbackMessage,
            requestError
        );

        if (
            requestError.response?.status === 401 ||
            requestError.response?.status === 403
        ) {

            clearSessionAndLogin();
            return;

        }

        setError(
            requestError.response?.data?.message ||
            fallbackMessage
        );

    };


    // =====================================================
    // LOAD DEPARTMENTS
    // =====================================================

    const loadDepartments =
        useCallback(async () => {

            try {

                const response = await api.get(
                    "/admin/visitors/filter-options",
                    getAuthConfig()
                );

                setDepartments(
                    response.data.departments || []
                );

            }

            catch (requestError) {

                handleApiError(
                    requestError,
                    "Unable to load departments."
                );

            }

        }, []);


    // =====================================================
    // LOAD EMPLOYEES
    // =====================================================

    const loadEmployees =
        useCallback(async () => {

            try {

                setLoading(true);
                setError("");

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

                if (departmentId) {
                    parameters.set(
                        "department_id",
                        departmentId
                    );
                }

                if (employeeStatus !== "ALL") {
                    parameters.set(
                        "status",
                        employeeStatus
                    );
                }

                if (accountStatus !== "ALL") {
                    parameters.set(
                        "account_status",
                        accountStatus
                    );
                }

                const response = await api.get(
                    `/admin/access/employees?${parameters.toString()}`,
                    getAuthConfig()
                );

                setEmployees(
                    response.data.employees || []
                );

                setTotalRecords(
                    Number(response.data.total) || 0
                );

                setTotalPages(
                    Number(
                        response.data.pagination?.total_pages
                    ) || 1
                );

            }

            catch (requestError) {

                handleApiError(
                    requestError,
                    "Unable to load employees."
                );

            }

            finally {
                setLoading(false);
            }

        }, [
            currentPage,
            search,
            departmentId,
            employeeStatus,
            accountStatus
        ]);


    // =====================================================
    // EFFECTS
    // =====================================================

    useEffect(() => {
        loadDepartments();
    }, [loadDepartments]);


    useEffect(() => {

        const searchDelay =
            window.setTimeout(
                loadEmployees,
                350
            );

        return () => {
            window.clearTimeout(searchDelay);
        };

    }, [loadEmployees]);


    useEffect(() => {
        setCurrentPage(1);
    }, [
        search,
        departmentId,
        employeeStatus,
        accountStatus
    ]);


    // =====================================================
    // FILTERS
    // =====================================================

    const clearFilters = () => {

        setSearch("");
        setDepartmentId("");
        setEmployeeStatus("ALL");
        setAccountStatus("ALL");
        setCurrentPage(1);

    };


    // =====================================================
    // PASSWORD VALIDATION
    // =====================================================

    const validatePassword = (
        passwordValue,
        confirmationValue
    ) => {

        if (!passwordValue) {
            return "Password is required.";
        }

        if (passwordValue.length < 8) {
            return "Password must contain at least 8 characters.";
        }

        if (!/[A-Z]/.test(passwordValue)) {
            return "Password must contain an uppercase letter.";
        }

        if (!/[a-z]/.test(passwordValue)) {
            return "Password must contain a lowercase letter.";
        }

        if (!/[0-9]/.test(passwordValue)) {
            return "Password must contain a number.";
        }

        if (
            !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(
                passwordValue
            )
        ) {
            return "Password must contain a special character.";
        }

        if (
            passwordValue !==
            confirmationValue
        ) {
            return "Password and confirmation do not match.";
        }

        return "";

    };


    // =====================================================
    // CREATE LOGIN
    // =====================================================

    const openCreateLogin = employee => {

        if (!employee.is_active) {

            alert(
                "Activate this employee before creating their login."
            );

            return;

        }

        if (!employee.email) {

            alert(
                "Add an email address before creating login access."
            );

            return;

        }

        setSelectedEmployee(employee);
        setTemporaryPassword("");
        setConfirmPassword("");
        setShowCreatePassword(false);
        setCreateAccountError("");

    };


    const closeCreateLogin = () => {

        if (creatingAccount) {
            return;
        }

        setSelectedEmployee(null);
        setTemporaryPassword("");
        setConfirmPassword("");
        setCreateAccountError("");

    };


    const createOfficialLogin = async event => {

        event.preventDefault();

        if (!selectedEmployee) {
            return;
        }

        const validationError =
            validatePassword(
                temporaryPassword,
                confirmPassword
            );

        if (validationError) {

            setCreateAccountError(
                validationError
            );

            return;

        }

        try {

            setCreatingAccount(true);
            setCreateAccountError("");

            const response = await api.post(
                "/admin/access/accounts/official",
                {
                    employee_id:
                        selectedEmployee.id,

                    temporary_password:
                        temporaryPassword
                },
                getAuthConfig()
            );

            alert(
                `${response.data.message}\n\n` +
                `Employee: ${selectedEmployee.employee_name}\n` +
                `Login Email: ${selectedEmployee.email}\n` +
                `Password: ${temporaryPassword}\n\n` +
                "Share these details securely with the employee."
            );

            closeCreateLogin();

            await loadEmployees();

        }

        catch (requestError) {

            console.error(
                "Create official login error:",
                requestError
            );

            if (
                requestError.response?.status === 401 ||
                requestError.response?.status === 403
            ) {

                clearSessionAndLogin();
                return;

            }

            setCreateAccountError(
                requestError.response?.data?.message ||
                "Unable to create employee login."
            );

        }

        finally {
            setCreatingAccount(false);
        }

    };


    // =====================================================
    // MANAGE ACCOUNT
    // =====================================================

    const openManageAccount = employee => {

        setManagedEmployee(employee);
        setResetPassword("");
        setConfirmResetPassword("");
        setShowResetPassword(false);
        setManageAccountError("");

    };


    const closeManageAccount = () => {

        if (managingAccount) {
            return;
        }

        setManagedEmployee(null);
        setResetPassword("");
        setConfirmResetPassword("");
        setManageAccountError("");

    };


    const handleResetPassword = async event => {

        event.preventDefault();

        if (!managedEmployee?.official_account_id) {
            return;
        }

        const validationError =
            validatePassword(
                resetPassword,
                confirmResetPassword
            );

        if (validationError) {

            setManageAccountError(
                validationError
            );

            return;

        }

        const confirmed =
            window.confirm(
                `Reset password for ${managedEmployee.employee_name}? The previous password will immediately stop working.`
            );

        if (!confirmed) {
            return;
        }

        try {

            setManagingAccount(true);
            setManageAccountError("");

            await api.put(
                `/admin/access/accounts/official/${managedEmployee.official_account_id}/reset-password`,
                {
                    temporary_password:
                        resetPassword
                },
                getAuthConfig()
            );

            alert(
                `Password reset successfully.\n\n` +
                `Employee: ${managedEmployee.employee_name}\n` +
                `Login Email: ${
                    managedEmployee.official_login_email ||
                    managedEmployee.email
                }\n` +
                `New Password: ${resetPassword}\n\n` +
                "Share the new password securely."
            );

            setResetPassword("");
            setConfirmResetPassword("");

            await loadEmployees();

        }

        catch (requestError) {

            console.error(
                "Reset password error:",
                requestError
            );

            setManageAccountError(
                requestError.response?.data?.message ||
                "Unable to reset the password."
            );

        }

        finally {
            setManagingAccount(false);
        }

    };


    const handleAccountStatus = async () => {

        if (!managedEmployee?.official_account_id) {
            return;
        }

        const newStatus =
            !managedEmployee.official_account_active;

        const action =
            newStatus
                ? "activate"
                : "deactivate";

        const confirmed =
            window.confirm(
                `Are you sure you want to ${action} the login account for ${managedEmployee.employee_name}?`
            );

        if (!confirmed) {
            return;
        }

        try {

            setManagingAccount(true);
            setManageAccountError("");

            await api.put(
                `/admin/access/accounts/official/${managedEmployee.official_account_id}/status`,
                {
                    is_active:
                        newStatus
                },
                getAuthConfig()
            );

            setManagedEmployee(previous => ({
                ...previous,
                official_account_active:
                    newStatus
            }));

            await loadEmployees();

        }

        catch (requestError) {

            console.error(
                "Update account status error:",
                requestError
            );

            setManageAccountError(
                requestError.response?.data?.message ||
                "Unable to update account status."
            );

        }

        finally {
            setManagingAccount(false);
        }

    };


    const handleUnlockAccount = async () => {

        if (!managedEmployee?.official_account_id) {
            return;
        }

        try {

            setManagingAccount(true);
            setManageAccountError("");

            await api.put(
                `/admin/access/accounts/official/${managedEmployee.official_account_id}/unlock`,
                {},
                getAuthConfig()
            );

            setManagedEmployee(previous => ({
                ...previous,
                failed_login_attempts: 0,
                locked_until: null
            }));

            alert(
                "Employee account unlocked successfully."
            );

            await loadEmployees();

        }

        catch (requestError) {

            console.error(
                "Unlock account error:",
                requestError
            );

            setManageAccountError(
                requestError.response?.data?.message ||
                "Unable to unlock the account."
            );

        }

        finally {
            setManagingAccount(false);
        }

    };


    // =====================================================
    // ADD / EDIT EMPLOYEE
    // =====================================================

    const openAddEmployee = () => {

    setEmployeeForm({
        employee_code: "",
        employee_name: "",
        department_id: "",
        email: "",
        unit: "UFI BAWAL"
    });

    setEmployeeFormError("");
    setEmployeeFormOpen(true);

};



    const closeEmployeeForm = () => {

    if (savingEmployee) {
        return;
    }

    setEmployeeFormOpen(false);
    setEmployeeFormError("");

};


    const handleEmployeeFormChange = event => {

        const {
            name,
            value
        } = event.target;

        setEmployeeForm(previous => ({
            ...previous,
            [name]: value
        }));

        setEmployeeFormError("");

    };


    const saveEmployee = async event => {

        event.preventDefault();

        const employeeName =
            employeeForm.employee_name.trim();

        const email =
            employeeForm.email.trim();

        if (!employeeName) {

            setEmployeeFormError(
                "Employee name is required."
            );

            return;

        }

        if (!employeeForm.department_id) {

            setEmployeeFormError(
                "Department is required."
            );

            return;

        }

        if (
            email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {

            setEmployeeFormError(
                "Enter a valid employee email."
            );

            return;

        }

        const requestBody = {
            employee_code:
                employeeForm.employee_code.trim() ||
                null,

            employee_name:
                employeeName,

            department_id:
                Number(employeeForm.department_id),

            email:
                email || null,

            unit:
                employeeForm.unit.trim() ||
                null
        };

        try {

            setSavingEmployee(true);
            setEmployeeFormError("");

            await api.post(
    "/admin/access/employees",
    requestBody,
    getAuthConfig()
);

alert(
    "Employee created successfully."
);

            setEmployeeFormOpen(false);
            setEditingEmployee(null);

            await loadEmployees();

        }

        catch (requestError) {

            console.error(
                "Save employee error:",
                requestError
            );

            setEmployeeFormError(
                requestError.response?.data?.message ||
                "Unable to save employee."
            );

        }

        finally {
            setSavingEmployee(false);
        }

    };


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="access-page">

            <main className="access-content">

                <div className="access-page-heading">

                    <div>

                        <span className="access-eyebrow">
                            USER MANAGEMENT
                        </span>

                        <h1>
                            Employees & Access
                        </h1>

                        <p>
                            Create and manage employee login access.
                        </p>

                    </div>


                    <div className="access-heading-actions">

                        <div className="access-record-count">

                            <span>
                                Total Employees
                            </span>

                            <strong>
                                {totalRecords}
                            </strong>

                        </div>


                        <button
                            type="button"
                            className="access-add-employee-button"
                            onClick={openAddEmployee}
                        >
                            + Add Employee
                        </button>

                    </div>

                </div>


                {error && (

                    <div className="access-error">
                        {error}
                    </div>

                )}


                <section className="access-filter-panel">

                    <div className="access-filter-field access-search-field">

                        <label htmlFor="employeeSearch">
                            Search
                        </label>

                        <input
                            id="employeeSearch"
                            type="text"
                            value={search}
                            onChange={event =>
                                setSearch(event.target.value)
                            }
                            placeholder="Name, employee code, email or unit"
                        />

                    </div>


                    <div className="access-filter-field">

                        <label htmlFor="departmentFilter">
                            Department
                        </label>

                        <select
                            id="departmentFilter"
                            value={departmentId}
                            onChange={event =>
                                setDepartmentId(event.target.value)
                            }
                        >

                            <option value="">
                                All Departments
                            </option>

                            {departments.map(department => (

                                <option
                                    key={department.id}
                                    value={department.id}
                                >
                                    {department.department_name}
                                </option>

                            ))}

                        </select>

                    </div>


                    <div className="access-filter-field">

                        <label htmlFor="employeeStatusFilter">
                            Employee Status
                        </label>

                        <select
                            id="employeeStatusFilter"
                            value={employeeStatus}
                            onChange={event =>
                                setEmployeeStatus(event.target.value)
                            }
                        >

                            <option value="ALL">
                                All Employees
                            </option>

                            <option value="ACTIVE">
                                Active
                            </option>

                            <option value="INACTIVE">
                                Inactive
                            </option>

                        </select>

                    </div>


                    <div className="access-filter-field">

                        <label htmlFor="accountStatusFilter">
                            Login Account
                        </label>

                        <select
                            id="accountStatusFilter"
                            value={accountStatus}
                            onChange={event =>
                                setAccountStatus(event.target.value)
                            }
                        >

                            <option value="ALL">
                                All Accounts
                            </option>

                            <option value="CREATED">
                                Login Created
                            </option>

                            <option value="NOT_CREATED">
                                Login Not Created
                            </option>

                        </select>

                    </div>


                    <button
                        type="button"
                        className="access-clear-button"
                        onClick={clearFilters}
                    >
                        Clear Filters
                    </button>

                </section>


                <section className="access-employee-panel">

                    <div className="access-panel-heading">

                        <div>

                            <h2>
                                Employee Accounts
                            </h2>

                            <p>
                                Showing {employees.length} of {totalRecords} employees
                            </p>

                        </div>

                    </div>


                    {loading ? (

                        <div className="access-loading">

                            <div className="access-spinner" />

                            <p>
                                Loading employees...
                            </p>

                        </div>

                    ) : employees.length === 0 ? (

                        <div className="access-empty">

                            <h3>
                                No employees found
                            </h3>

                            <p>
                                Try changing or clearing the filters.
                            </p>

                        </div>

                    ) : (

                        <div className="access-table-container">

                            <table>

                                <thead>

                                    <tr>
                                        <th>Employee</th>
                                        <th>Employee Code</th>
                                        <th>Department</th>
                                        <th>Email / Login ID</th>
                                        <th>Unit</th>
                                        <th>Employee Status</th>
                                        <th>Login Account</th>
                                        <th>Account Status</th>
                                        <th>Actions</th>
                                    </tr>

                                </thead>


                                <tbody>

                                    {employees.map(employee => (

                                        <tr key={employee.id}>

                                            <td>

                                                <div className="access-employee-cell">

                                                    <div className="access-employee-avatar">
                                                        {
                                                            employee.employee_name
                                                                ?.charAt(0)
                                                                .toUpperCase() ||
                                                            "E"
                                                        }
                                                    </div>

                                                    <div>

                                                        <strong>
                                                            {employee.employee_name}
                                                        </strong>

                                                        <span>
                                                            ID #{employee.id}
                                                        </span>

                                                    </div>

                                                </div>

                                            </td>

                                            <td>
                                                {employee.employee_code || "-"}
                                            </td>

                                            <td>
                                                {employee.department_name || "-"}
                                            </td>

                                            <td className="access-email-cell">
                                                {employee.email || "-"}
                                            </td>

                                            <td>
                                                {employee.unit || "-"}
                                            </td>

                                            <td>

                                                <span
                                                    className={
                                                        employee.is_active
                                                            ? "access-badge active"
                                                            : "access-badge inactive"
                                                    }
                                                >
                                                    {
                                                        employee.is_active
                                                            ? "Active"
                                                            : "Inactive"
                                                    }
                                                </span>

                                            </td>

                                            <td>

                                                <span
                                                    className={
                                                        employee.has_official_account
                                                            ? "access-badge created"
                                                            : "access-badge missing"
                                                    }
                                                >
                                                    {
                                                        employee.has_official_account
                                                            ? "Created"
                                                            : "Not Created"
                                                    }
                                                </span>

                                            </td>

                                            <td>

                                                {!employee.has_official_account ? (
                                                    "-"
                                                ) : (

                                                    <span
                                                        className={
                                                            employee.official_account_active
                                                                ? "access-badge active"
                                                                : "access-badge inactive"
                                                        }
                                                    >
                                                        {
                                                            employee.official_account_active
                                                                ? "Active"
                                                                : "Inactive"
                                                        }
                                                    </span>

                                                )}

                                            </td>

                                            <td>

                                                <div className="access-row-actions">

                                                

                                                    <button
                                                        type="button"
                                                        className={
                                                            employee.has_official_account
                                                                ? "access-action-button manage"
                                                                : "access-action-button create"
                                                        }
                                                        onClick={() => {

                                                            if (
                                                                employee.has_official_account
                                                            ) {
                                                                openManageAccount(employee);
                                                                return;
                                                            }

                                                            openCreateLogin(employee);

                                                        }}
                                                    >
                                                        {
                                                            employee.has_official_account
                                                                ? "Manage"
                                                                : "Create Login"
                                                        }
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    )}


                    <div className="access-pagination">

                        <span>
                            Page {currentPage} of {totalPages}
                        </span>

                        <div>

                            <button
                                type="button"
                                disabled={currentPage <= 1}
                                onClick={() =>
                                    setCurrentPage(previous =>
                                        Math.max(previous - 1, 1)
                                    )
                                }
                            >
                                Previous
                            </button>

                            <button
                                type="button"
                                disabled={currentPage >= totalPages}
                                onClick={() =>
                                    setCurrentPage(previous =>
                                        Math.min(
                                            previous + 1,
                                            totalPages
                                        )
                                    )
                                }
                            >
                                Next
                            </button>

                        </div>

                    </div>

                </section>

            </main>


            {/* CREATE LOGIN MODAL */}

            {selectedEmployee && (

                <div className="access-modal-overlay">

                    <div className="access-account-modal">

                        <div className="access-modal-header">

                            <div>
                                <span>CREATE OFFICIAL LOGIN</span>
                                <h2>Employee Login Access</h2>
                            </div>

                            <button
                                type="button"
                                onClick={closeCreateLogin}
                                disabled={creatingAccount}
                            >
                                ×
                            </button>

                        </div>

                        <div className="access-selected-employee">

                            <div className="access-employee-avatar">
                                {
                                    selectedEmployee.employee_name
                                        ?.charAt(0)
                                        .toUpperCase() ||
                                    "E"
                                }
                            </div>

                            <div>
                                <strong>{selectedEmployee.employee_name}</strong>
                                <span>{selectedEmployee.employee_code || "-"}</span>
                                <small>{selectedEmployee.email}</small>
                            </div>

                        </div>

                        {createAccountError && (
                            <div className="access-modal-error">
                                {createAccountError}
                            </div>
                        )}

                        <form onSubmit={createOfficialLogin}>

                            <div className="access-modal-field">
                                <label>Login Email</label>
                                <input
                                    value={selectedEmployee.email}
                                    disabled
                                />
                            </div>

                            <div className="access-modal-field">
                                <label>Password</label>
                                <input
                                    type={showCreatePassword ? "text" : "password"}
                                    value={temporaryPassword}
                                    onChange={event => {
                                        setTemporaryPassword(event.target.value);
                                        setCreateAccountError("");
                                    }}
                                    disabled={creatingAccount}
                                />
                            </div>

                            <div className="access-modal-field">
                                <label>Confirm Password</label>
                                <input
                                    type={showCreatePassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={event => {
                                        setConfirmPassword(event.target.value);
                                        setCreateAccountError("");
                                    }}
                                    disabled={creatingAccount}
                                />
                            </div>

                            <label className="access-show-password">
                                <input
                                    type="checkbox"
                                    checked={showCreatePassword}
                                    onChange={event =>
                                        setShowCreatePassword(event.target.checked)
                                    }
                                />
                                Show password
                            </label>

                            <div className="access-password-rules">
                                Minimum 8 characters with uppercase,
                                lowercase, number and special character.
                            </div>

                            <div className="access-modal-actions">

                                <button
                                    type="button"
                                    className="cancel"
                                    onClick={closeCreateLogin}
                                    disabled={creatingAccount}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="submit"
                                    disabled={creatingAccount}
                                >
                                    {
                                        creatingAccount
                                            ? "Creating..."
                                            : "Create Login"
                                    }
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}


            {/* MANAGE ACCOUNT MODAL */}

            {managedEmployee && (

                <div className="access-modal-overlay">

                    <div className="access-account-modal access-manage-modal">

                        <div className="access-modal-header">

                            <div>
                                <span>ACCOUNT MANAGEMENT</span>
                                <h2>Manage Employee Login</h2>
                            </div>

                            <button
                                type="button"
                                onClick={closeManageAccount}
                                disabled={managingAccount}
                            >
                                ×
                            </button>

                        </div>

                        <div className="access-selected-employee">

                            <div className="access-employee-avatar">
                                {
                                    managedEmployee.employee_name
                                        ?.charAt(0)
                                        .toUpperCase() ||
                                    "E"
                                }
                            </div>

                            <div>
                                <strong>{managedEmployee.employee_name}</strong>
                                <span>{managedEmployee.employee_code || "-"}</span>
                                <small>
                                    {
                                        managedEmployee.official_login_email ||
                                        managedEmployee.email
                                    }
                                </small>
                            </div>

                        </div>

                        {manageAccountError && (
                            <div className="access-modal-error">
                                {manageAccountError}
                            </div>
                        )}

                        <div className="access-manage-information">

                            <div>
                                <span>Account ID</span>
                                <strong>#{managedEmployee.official_account_id}</strong>
                            </div>

                            <div>
                                <span>Login Status</span>
                                <strong>
                                    {
                                        managedEmployee.official_account_active
                                            ? "Active"
                                            : "Inactive"
                                    }
                                </strong>
                            </div>

                            <div>
                                <span>Failed Attempts</span>
                                <strong>
                                    {managedEmployee.failed_login_attempts ?? 0}
                                </strong>
                            </div>

                            <div>
                                <span>Lock Status</span>
                                <strong>
                                    {
                                        managedEmployee.locked_until
                                            ? new Date(
                                                managedEmployee.locked_until
                                            ).toLocaleString("en-IN")
                                            : "Not Locked"
                                    }
                                </strong>
                            </div>

                        </div>

                        <div className="access-manage-actions">

                            <button
                                type="button"
                                className={
                                    managedEmployee.official_account_active
                                        ? "deactivate"
                                        : "activate"
                                }
                                onClick={handleAccountStatus}
                                disabled={managingAccount}
                            >
                                {
                                    managedEmployee.official_account_active
                                        ? "Deactivate Account"
                                        : "Activate Account"
                                }
                            </button>

                            <button
                                type="button"
                                className="unlock"
                                onClick={handleUnlockAccount}
                                disabled={
                                    managingAccount ||
                                    (
                                        !managedEmployee.locked_until &&
                                        Number(
                                            managedEmployee.failed_login_attempts
                                        ) === 0
                                    )
                                }
                            >
                                Unlock Account
                            </button>

                        </div>

                        <form
                            className="access-reset-form"
                            onSubmit={handleResetPassword}
                        >

                            <div className="access-reset-heading">
                                <h3>Reset Password</h3>
                                <p>
                                    The existing password will immediately stop working.
                                </p>
                            </div>

                            <div className="access-modal-field">
                                <label>New Password</label>
                                <input
                                    type={showResetPassword ? "text" : "password"}
                                    value={resetPassword}
                                    onChange={event => {
                                        setResetPassword(event.target.value);
                                        setManageAccountError("");
                                    }}
                                />
                            </div>

                            <div className="access-modal-field">
                                <label>Confirm New Password</label>
                                <input
                                    type={showResetPassword ? "text" : "password"}
                                    value={confirmResetPassword}
                                    onChange={event => {
                                        setConfirmResetPassword(event.target.value);
                                        setManageAccountError("");
                                    }}
                                />
                            </div>

                            <label className="access-show-password">
                                <input
                                    type="checkbox"
                                    checked={showResetPassword}
                                    onChange={event =>
                                        setShowResetPassword(event.target.checked)
                                    }
                                />
                                Show password
                            </label>

                            <div className="access-modal-actions">

                                <button
                                    type="button"
                                    className="cancel"
                                    onClick={closeManageAccount}
                                >
                                    Close
                                </button>

                                <button
                                    type="submit"
                                    className="submit"
                                    disabled={
                                        managingAccount ||
                                        !resetPassword ||
                                        !confirmResetPassword
                                    }
                                >
                                    {
                                        managingAccount
                                            ? "Updating..."
                                            : "Reset Password"
                                    }
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}


            {/* ADD / EDIT EMPLOYEE MODAL */}

            {employeeFormOpen && (

                <div className="access-modal-overlay">

                    <div className="access-account-modal">

                        <div className="access-modal-header">

                            <div>
                                <span>
    NEW EMPLOYEE
</span>

<h2>
    Add Employee
</h2>
                            </div>

                            <button
                                type="button"
                                onClick={closeEmployeeForm}
                                disabled={savingEmployee}
                            >
                                ×
                            </button>

                        </div>

                        {employeeFormError && (
                            <div className="access-modal-error">
                                {employeeFormError}
                            </div>
                        )}

                        <form onSubmit={saveEmployee}>

                            <div className="access-modal-field">
                                <label>Employee Code</label>
                                <input
                                    name="employee_code"
                                    value={employeeForm.employee_code}
                                    onChange={handleEmployeeFormChange}
                                    disabled={savingEmployee}
                                />
                            </div>

                            <div className="access-modal-field">
                                <label>Employee Name *</label>
                                <input
                                    name="employee_name"
                                    value={employeeForm.employee_name}
                                    onChange={handleEmployeeFormChange}
                                    disabled={savingEmployee}
                                />
                            </div>

                            <div className="access-modal-field">
                                <label>Department *</label>
                                <select
                                    name="department_id"
                                    value={employeeForm.department_id}
                                    onChange={handleEmployeeFormChange}
                                    disabled={savingEmployee}
                                >
                                    <option value="">
                                        Select Department
                                    </option>

                                    {departments.map(department => (
                                        <option
                                            key={department.id}
                                            value={department.id}
                                        >
                                            {department.department_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="access-modal-field">
                                <label>Email</label>
                                <input
                                    name="email"
                                    type="email"
                                    value={employeeForm.email}
                                    onChange={handleEmployeeFormChange}
                                    disabled={savingEmployee}
                                />
                            </div>

                            <div className="access-modal-field">
                                <label>Unit</label>
                                <input
                                    name="unit"
                                    value={employeeForm.unit}
                                    onChange={handleEmployeeFormChange}
                                    disabled={savingEmployee}
                                />
                            </div>

                            <div className="access-modal-actions">

                                <button
                                    type="button"
                                    className="cancel"
                                    onClick={closeEmployeeForm}
                                    disabled={savingEmployee}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="submit"
                                    disabled={savingEmployee}
                                >
                                    {
    savingEmployee
        ? "Saving..."
        : "Add Employee"
}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>

    );

}


export default AdminEmployeeAccess;