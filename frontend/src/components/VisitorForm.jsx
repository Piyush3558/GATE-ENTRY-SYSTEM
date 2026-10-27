import {
    useEffect,
    useRef,
    useState
} from "react";

import api from "../services/api";

import "./VisitorForm.css";


function VisitorForm({
    onClose,
    onSaved,
    visitor = null
}) {

    const isEditMode = Boolean(visitor?.id);

    // =====================================================
    // FORM DATA
    // =====================================================

    const [formData, setFormData] =
        useState({
            visitor_name: "",
            address: "",
            mobile_number: "",
            purpose_of_visit: "",
            official_to_visit: "",
            official_email: ""
        });


    // =====================================================
    // TEAM MEMBERS
    // =====================================================

    const [groupMembers, setGroupMembers] =
        useState([]);


    // =====================================================
    // DEPARTMENT / EMPLOYEE STATES
    // =====================================================

    const [departments, setDepartments] =
        useState([]);

    const [employees, setEmployees] =
        useState([]);

    const [selectedDepartment, setSelectedDepartment] =
        useState("");

    const [selectedEmployee, setSelectedEmployee] =
        useState("");

    const [loadingDepartments, setLoadingDepartments] =
        useState(false);

    const [loadingEmployees, setLoadingEmployees] =
        useState(false);


    // =====================================================
    // FORM STATES
    // =====================================================

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const [success, setSuccess] =
        useState("");


    // =====================================================
    // PHOTO STATES
    // =====================================================

    const [photo, setPhoto] =
        useState(null);

    const [photoPreview, setPhotoPreview] =
        useState("");


    // =====================================================
    // CAMERA STATES
    // =====================================================

    const [cameraOpen, setCameraOpen] =
        useState(false);

    const [cameraError, setCameraError] =
        useState("");

     const [cameraFacing, setCameraFacing] =
    useState("user");   


    // =====================================================
    // REFS
    // =====================================================

    const videoRef =
        useRef(null);

    const streamRef =
        useRef(null);

    const canvasRef =
        useRef(null);


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

        let baseURL = api.defaults?.baseURL || "";
        baseURL = baseURL.replace(/\/api\/?$/, "");
        baseURL = baseURL.replace(/\/$/, "");

        const normalizedPath =
            photoPath.startsWith("/")
                ? photoPath
                : `/${photoPath}`;

        return `${baseURL}${normalizedPath}`;
    };


    // =====================================================
    // LOAD EXISTING VISITOR IN EDIT MODE
    // =====================================================

    useEffect(() => {
        if (!isEditMode) {
            return;
        }

        setFormData({
            visitor_name: visitor.visitor_name || "",
            address: visitor.address || "",
            mobile_number: visitor.mobile_number || "",
            purpose_of_visit: visitor.purpose_of_visit || "",
            official_to_visit:
                visitor.official_to_visit ||
                visitor.official_name ||
                "",
            official_email: visitor.official_email || ""
        });

        setGroupMembers(
            Array.isArray(visitor.group_members)
                ? visitor.group_members.map((member, index) => ({
                    id:
                        member?.id ||
                        `existing-${index}-${Date.now()}`,
                    member_name:
                        typeof member === "string"
                            ? member
                            : member?.member_name || ""
                }))
                : []
        );

        setSelectedDepartment(
            visitor.department_id
                ? String(visitor.department_id)
                : ""
        );

        setSelectedEmployee(
            visitor.official_employee_id
                ? String(visitor.official_employee_id)
                : ""
        );

        setPhoto(null);
        setPhotoPreview(
            visitor.photo_path
                ? getPhotoUrl(visitor.photo_path)
                : ""
        );

        setError("");
        setSuccess("");
    }, [visitor, isEditMode]);


    // =====================================================
    // LOAD DEPARTMENTS
    // =====================================================

    useEffect(() => {

        const loadDepartments =
            async () => {

                try {

                    setLoadingDepartments(true);

                    setError("");


                    const response =
                        await api.get(
                            "/employees/departments"
                        );


                    if (
                        response.data.success
                    ) {

                        setDepartments(
                            response.data.departments ||
                            []
                        );

                    }

                }

                catch (departmentError) {

                    console.error(
                        "Failed to load departments:",
                        departmentError
                    );

                    setError(
                        "Unable to load departments."
                    );

                }

                finally {

                    setLoadingDepartments(false);

                }

            };


        loadDepartments();

    }, []);


    // =====================================================
    // LOAD EMPLOYEES WHEN DEPARTMENT CHANGES
    // =====================================================

    useEffect(() => {

        const loadEmployees =
            async () => {

                if (!selectedDepartment) {

                    setEmployees([]);

                    setSelectedEmployee("");

                    setFormData(previous => ({
                        ...previous,
                        official_to_visit: "",
                        official_email: ""
                    }));

                    return;

                }


                try {

                    setLoadingEmployees(true);

                    setError("");

                    setEmployees([]);

                    setSelectedEmployee("");

                    setFormData(previous => ({
                        ...previous,
                        official_to_visit: "",
                        official_email: ""
                    }));


                    const response =
                        await api.get(
                            `/employees/department/${selectedDepartment}`
                        );


                    if (
                        response.data.success
                    ) {

                        const loadedEmployees =
                            response.data.employees ||
                            [];

                        setEmployees(
                            loadedEmployees
                        );

                        const editingOriginalDepartment =
                            isEditMode &&
                            String(visitor?.department_id || "") ===
                                String(selectedDepartment);

                        if (editingOriginalDepartment) {
                            const originalEmployee =
                                loadedEmployees.find(
                                    employee =>
                                        String(employee.id) ===
                                        String(visitor?.official_employee_id)
                                );

                            if (originalEmployee) {
                                setSelectedEmployee(
                                    String(originalEmployee.id)
                                );

                                setFormData(previous => ({
                                    ...previous,
                                    official_to_visit:
                                        originalEmployee.employee_name ||
                                        originalEmployee.name ||
                                        visitor?.official_to_visit ||
                                        "",
                                    official_email:
                                        originalEmployee.email ||
                                        originalEmployee.official_email ||
                                        originalEmployee.employee_email ||
                                        visitor?.official_email ||
                                        ""
                                }));
                            }
                        }

                    }

                }

                catch (employeeError) {

                    console.error(
                        "Failed to load employees:",
                        employeeError
                    );

                    setError(
                        "Unable to load employees for this department."
                    );

                }

                finally {

                    setLoadingEmployees(false);

                }

            };


        loadEmployees();

    }, [selectedDepartment, isEditMode, visitor]);


    // =====================================================
    // HANDLE DEPARTMENT CHANGE
    // =====================================================

    const handleDepartmentChange =
        event => {

            const departmentId =
                event.target.value;


            setSelectedDepartment(
                departmentId
            );

            setSelectedEmployee("");

            setFormData(previous => ({
                ...previous,
                official_to_visit: "",
                official_email: ""
            }));

            setError("");

        };


    // =====================================================
    // HANDLE EMPLOYEE CHANGE
    // =====================================================

    const handleEmployeeChange =
        event => {

            const employeeId =
                event.target.value;


            setSelectedEmployee(
                employeeId
            );


            const selectedEmployeeData =
                employees.find(
                    employee =>
                        String(employee.id) ===
                        String(employeeId)
                );


            if (selectedEmployeeData) {

                const employeeName =
                    selectedEmployeeData.employee_name ||
                    selectedEmployeeData.name ||
                    "";


                const employeeEmail =
                    selectedEmployeeData.email ||
                    selectedEmployeeData.official_email ||
                    selectedEmployeeData.employee_email ||
                    "";


                setFormData(previous => ({
                    ...previous,

                    official_to_visit:
                        employeeName,

                    official_email:
                        employeeEmail
                }));

            }

            else {

                setFormData(previous => ({
                    ...previous,
                    official_to_visit: "",
                    official_email: ""
                }));

            }


            setError("");

        };


    // =====================================================
    // HANDLE NORMAL INPUT
    // =====================================================

    const handleChange =
        event => {

            const {
                name,
                value
            } = event.target;


            // Mobile number accepts digits only
            if (
                name ===
                "mobile_number"
            ) {

                const numericalValue =
                    value
                        .replace(/\D/g, "")
                        .slice(0, 10);


                setFormData(previous => ({
                    ...previous,

                    mobile_number:
                        numericalValue
                }));

                setError("");

                return;

            }


            setFormData(previous => ({
                ...previous,
                [name]: value
            }));

            setError("");

        };


    // =====================================================
    // ADD TEAM MEMBER
    // =====================================================

    const addGroupMember = () => {

        if (
            groupMembers.length >= 20
        ) {

            setError(
                "A maximum of 20 accompanying members can be added."
            );

            return;

        }


        setGroupMembers(previous => ([
            ...previous,

            {
                id:
                    `${Date.now()}-${Math.random()}`,

                member_name: ""
            }
        ]));

        setError("");

    };


    // =====================================================
    // UPDATE TEAM MEMBER
    // =====================================================

    const updateGroupMember = (
        memberId,
        value
    ) => {

        setGroupMembers(previous =>

            previous.map(member =>

                member.id === memberId
                    ? {
                        ...member,
                        member_name: value
                    }
                    : member

            )

        );

        setError("");

    };


    // =====================================================
    // REMOVE TEAM MEMBER
    // =====================================================

    const removeGroupMember =
        memberId => {

            setGroupMembers(previous =>

                previous.filter(
                    member =>
                        member.id !== memberId
                )

            );

            setError("");

        };


    // =====================================================
    // STOP CAMERA
    // =====================================================

    const stopCamera = () => {

        if (streamRef.current) {

            streamRef.current
                .getTracks()
                .forEach(track => {

                    track.stop();

                });

            streamRef.current = null;

        }


        if (videoRef.current) {

            videoRef.current.srcObject =
                null;

        }

    };


    // =====================================================
    // CLEANUP CAMERA AND PHOTO PREVIEW
    // =====================================================

    useEffect(() => {

        return () => {

            stopCamera();

        };

    }, []);


    useEffect(() => {

        return () => {

            if (photoPreview) {

                URL.revokeObjectURL(
                    photoPreview
                );

            }

        };

    }, [photoPreview]);


    // =====================================================
// OPEN CAMERA
// =====================================================

const openCamera = async (
    facingMode = cameraFacing
) => {

    try {

        setCameraError("");
        setError("");

        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {

            setCameraError(
                "Camera is not supported by this browser."
            );

            return;
        }


        if (
            !window.isSecureContext &&
            window.location.hostname !== "localhost"
        ) {

            setCameraError(
                "Camera requires HTTPS. Please open the application using an HTTPS address."
            );

            return;
        }


        // Stop current camera before opening another one
        stopCamera();


        let stream;

        try {

            stream =
                await navigator.mediaDevices.getUserMedia({

                    video: {

                        facingMode: {
                            ideal: facingMode
                        },

                        width: {
                            ideal: 1280
                        },

                        height: {
                            ideal: 720
                        }

                    },

                    audio: false

                });

        }

        catch (firstCameraError) {

            console.warn(
                "Preferred camera failed. Trying default camera:",
                firstCameraError
            );


            // Fallback if requested camera is unavailable
            stream =
                await navigator.mediaDevices.getUserMedia({

                    video: true,

                    audio: false

                });

        }


        streamRef.current =
            stream;


        setCameraFacing(
            facingMode
        );


        setCameraOpen(true);


        window.setTimeout(() => {

            if (videoRef.current) {

                videoRef.current.srcObject =
                    stream;

                videoRef.current.muted =
                    true;

                videoRef.current.playsInline =
                    true;


                videoRef.current
                    .play()
                    .catch(videoError => {

                        console.error(
                            "Video play error:",
                            videoError
                        );

                    });

            }

        }, 100);

    }

    catch (cameraAccessError) {

        console.error(
            "Camera access error:",
            cameraAccessError
        );


        if (
            cameraAccessError.name ===
            "NotAllowedError"
        ) {

            setCameraError(
                "Camera permission was denied. Please allow camera access in your browser settings."
            );

        }

        else if (
            cameraAccessError.name ===
            "NotFoundError"
        ) {

            setCameraError(
                "No camera was found on this device."
            );

        }

        else if (
            cameraAccessError.name ===
            "NotReadableError"
        ) {

            setCameraError(
                "The camera is already being used by another application."
            );

        }

        else if (
            cameraAccessError.name ===
            "SecurityError"
        ) {

            setCameraError(
                "Camera access was blocked because this page is not secure."
            );

        }

        else {

            setCameraError(
                `Unable to access camera: ${
                    cameraAccessError.message ||
                    "Unknown camera error"
                }`
            );

        }

    }

};

// =====================================================
// FLIP FRONT / BACK CAMERA
// =====================================================

const flipCamera = async () => {

    const newFacingMode =
        cameraFacing === "user"
            ? "environment"
            : "user";


    setCameraFacing(
        newFacingMode
    );


    await openCamera(
        newFacingMode
    );

};

    // =====================================================
    // CLOSE CAMERA
    // =====================================================

    const closeCamera = () => {

        stopCamera();

        setCameraOpen(false);

        setCameraError("");

    };


    // =====================================================
    // CAPTURE PHOTO
    // =====================================================

    const capturePhoto = () => {

        const video =
            videoRef.current;

        const canvas =
            canvasRef.current;


        if (!video) {

            setCameraError(
                "Camera video is not available."
            );

            return;

        }


        if (!canvas) {

            setCameraError(
                "Camera canvas is not available."
            );

            return;

        }


        if (
            video.readyState < 2 ||
            video.videoWidth === 0 ||
            video.videoHeight === 0
        ) {

            setCameraError(
                "Camera is still starting. Please wait a moment and try again."
            );

            return;

        }


        canvas.width =
            video.videoWidth;

        canvas.height =
            video.videoHeight;


        const context =
            canvas.getContext("2d");


        if (!context) {

            setCameraError(
                "Unable to capture photo."
            );

            return;

        }


        context.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height
        );


        canvas.toBlob(
            blob => {

                if (!blob) {

                    setCameraError(
                        "Unable to create photo."
                    );

                    return;

                }


                const capturedFile =
                    new File(
                        [blob],

                        `visitor_${Date.now()}.jpg`,

                        {
                            type: "image/jpeg"
                        }
                    );


                if (photoPreview) {

                    URL.revokeObjectURL(
                        photoPreview
                    );

                }


                setPhoto(
                    capturedFile
                );

                setPhotoPreview(
                    URL.createObjectURL(
                        capturedFile
                    )
                );

                closeCamera();

            },

            "image/jpeg",

            0.9
        );

    };


    // =====================================================
    // RETAKE PHOTO
    // =====================================================

    const retakePhoto = () => {

        if (photoPreview) {

            URL.revokeObjectURL(
                photoPreview
            );

        }


        setPhoto(null);

        setPhotoPreview("");

        setCameraError("");

        openCamera();

    };


    // =====================================================
    // CLOSE VISITOR FORM
    // =====================================================

    const closeVisitorForm = () => {

        if (saving) {
            return;
        }


        closeCamera();

        onClose();

    };


    // =====================================================
    // SUBMIT VISITOR REQUEST
    // =====================================================

    const handleSubmit = async event => {

        event.preventDefault();

        setError("");

        setSuccess("");


        // =================================================
        // PRIMARY VISITOR VALIDATION
        // =================================================

        if (
            !formData.visitor_name.trim()
        ) {

            setError(
                "Visitor name is required."
            );

            return;

        }


        if (
            !formData.mobile_number.trim()
        ) {

            setError(
                "Mobile number is required."
            );

            return;

        }


        if (
            !/^\d{10}$/.test(
                formData.mobile_number
            )
        ) {

            setError(
                "Mobile number must contain exactly 10 digits."
            );

            return;

        }


        if (
            !formData.purpose_of_visit.trim()
        ) {

            setError(
                "Purpose of visit is required."
            );

            return;

        }


        if (!selectedDepartment) {

            setError(
                "Please select a department."
            );

            return;

        }


        if (!selectedEmployee) {

            setError(
                "Please select the official you want to visit."
            );

            return;

        }


        if (
            !formData.official_to_visit.trim()
        ) {

            setError(
                "Official to visit is required."
            );

            return;

        }


        if (
            !formData.official_email.trim()
        ) {

            setError(
                "The selected official does not have an email address."
            );

            return;

        }


        // =================================================
        // TEAM-MEMBER VALIDATION
        // =================================================

        const cleanedGroupMembers =
            groupMembers.map(
                member =>
                    member.member_name.trim()
            );


        if (
            cleanedGroupMembers.some(
                memberName =>
                    !memberName
            )
        ) {

            setError(
                "Please enter the name of every added team member or remove the empty row."
            );

            return;

        }


        if (
            cleanedGroupMembers.some(
                memberName =>
                    memberName.length > 150
            )
        ) {

            setError(
                "A team-member name cannot exceed 150 characters."
            );

            return;

        }


        const normalizedMemberNames =
            cleanedGroupMembers.map(
                memberName =>
                    memberName.toLowerCase()
            );


        if (
            new Set(
                normalizedMemberNames
            ).size !==
            normalizedMemberNames.length
        ) {

            setError(
                "The same team member cannot be added more than once."
            );

            return;

        }


        if (
            normalizedMemberNames.includes(
                formData.visitor_name
                    .trim()
                    .toLowerCase()
            )
        ) {

            setError(
                "The primary visitor cannot also be added as an accompanying member."
            );

            return;

        }


        try {

            setSaving(true);


            // =================================================
            // CREATE MULTIPART FORM DATA
            // =================================================

            const data =
                new FormData();


            data.append(
                "visitor_name",
                formData.visitor_name.trim()
            );


            data.append(
                "address",
                formData.address.trim()
            );


            data.append(
                "mobile_number",
                formData.mobile_number
            );


            data.append(
                "group_members",
                JSON.stringify(
                    cleanedGroupMembers
                )
            );


            data.append(
                "purpose_of_visit",
                formData.purpose_of_visit.trim()
            );


            data.append(
                "official_to_visit",
                formData.official_to_visit.trim()
            );


            data.append(
                "official_employee_id",
                selectedEmployee
            );


            data.append(
                "official_email",
                formData.official_email.trim()
            );


            if (photo) {

                data.append(
                    "photo",
                    photo
                );

            }


            // =================================================
            // SEND REQUEST
            // =================================================

            const response =
                isEditMode
                    ? await api.put(
                        `/visitors/${visitor.id}`,
                        data
                    )
                    : await api.post(
                        "/visitors",
                        data
                    );


            if (
                response.data.success
            ) {

                setSuccess(
                    response.data.message ||
                    "Visitor request submitted successfully."
                );


                if (onSaved) {

                    onSaved();

                }


                window.setTimeout(() => {

                    closeCamera();

                    onClose();

                }, 1200);

            }

        }

        catch (submitError) {

            console.error(
                isEditMode
                    ? "Update visitor error:"
                    : "Create visitor error:",
                submitError
            );


            console.error(
                "Server response:",
                submitError.response?.data
            );


            setError(
                submitError.response?.data?.message ||
                (isEditMode
                    ? "Failed to update visitor details."
                    : "Failed to create visitor request.")
            );

        }

        finally {

            setSaving(false);

        }

    };


    // =====================================================
    // RENDER
    // =====================================================

    return (

        <div className="visitor-form-overlay">

            <div className="visitor-form-modal">

                {/* HEADER */}

                <div className="visitor-form-header">

                    <div>

                        <h2>
                            {
                                isEditMode
                                    ? "Edit Visitor"
                                    : "New Visitor Entry"
                            }
                        </h2>

                        <p>
                            {
                                isEditMode
                                    ? "Correct visitor details before check-in"
                                    : "Enter visitor and team details"
                            }
                        </p>

                    </div>


                    <button
                        type="button"
                        className="close-button"
                        onClick={
                            closeVisitorForm
                        }
                        disabled={
                            saving
                        }
                        aria-label="Close visitor form"
                    >
                        ×
                    </button>

                </div>


                {/* FORM */}

                <form
                    onSubmit={
                        handleSubmit
                    }
                    className="visitor-form"
                >

                    {error && (

                        <div
                            className="form-error"
                            role="alert"
                        >
                            {error}
                        </div>

                    )}


                    {success && (

                        <div
                            className="form-success"
                            role="status"
                        >
                            {success}
                        </div>

                    )}


                    {/* VISITOR NAME */}

                    <div className="form-group">

                        <label htmlFor="visitorName">

                            Visitor Name

                            <span>
                                *
                            </span>

                        </label>


                        <input
                            id="visitorName"
                            type="text"
                            name="visitor_name"
                            value={
                                formData.visitor_name
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="Enter primary visitor name"
                            maxLength={150}
                            autoComplete="off"
                            disabled={
                                saving
                            }
                        />

                    </div>


                    {/* ADDRESS */}

                    <div className="form-group">

                        <label htmlFor="visitorAddress">
                            Address
                        </label>


                        <textarea
                            id="visitorAddress"
                            name="address"
                            value={
                                formData.address
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="Enter visitor address"
                            rows={3}
                            disabled={
                                saving
                            }
                        />

                    </div>


                    {/* MOBILE NUMBER */}

                    <div className="form-group">

                        <label htmlFor="visitorMobile">

                            Mobile Number

                            <span>
                                *
                            </span>

                        </label>


                        <input
                            id="visitorMobile"
                            type="text"
                            name="mobile_number"
                            value={
                                formData.mobile_number
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="Enter 10-digit mobile number"
                            inputMode="numeric"
                            pattern="[0-9]{10}"
                            maxLength={10}
                            autoComplete="off"
                            disabled={
                                saving
                            }
                        />


                        <small className="mobile-number-help">

                            {
                                formData.mobile_number
                                    .length
                            }/10 digits

                        </small>

                    </div>


                    {/* TEAM MEMBERS */}

                    <div className="form-group team-members-section">

                        <div className="team-members-heading">

                            <div>

                                <label>
                                    Accompanying Team Members
                                </label>

                                <p>
                                    Add people visiting with the primary visitor.
                                </p>

                            </div>


                            <button
                                type="button"
                                className="add-team-member-button"
                                onClick={
                                    addGroupMember
                                }
                                disabled={
                                    saving ||
                                    groupMembers.length >= 20
                                }
                            >
                                + Add Member
                            </button>

                        </div>


                        {groupMembers.length === 0 ? (

                            <div className="team-members-empty">
                                This is an individual visitor entry.
                            </div>

                        ) : (

                            <div className="team-members-list">

                                {groupMembers.map(
                                    (
                                        member,
                                        index
                                    ) => (

                                        <div
                                            className="team-member-row"
                                            key={member.id}
                                        >

                                            <div className="team-member-number">
                                                {index + 1}
                                            </div>


                                            <input
                                                type="text"
                                                value={
                                                    member.member_name
                                                }
                                                onChange={event => {

                                                    updateGroupMember(
                                                        member.id,
                                                        event.target.value
                                                    );

                                                }}
                                                placeholder={
                                                    `Enter member ${index + 1} name`
                                                }
                                                maxLength={150}
                                                disabled={
                                                    saving
                                                }
                                            />


                                            <button
                                                type="button"
                                                className="remove-team-member-button"
                                                onClick={() => {

                                                    removeGroupMember(
                                                        member.id
                                                    );

                                                }}
                                                disabled={
                                                    saving
                                                }
                                                aria-label={
                                                    `Remove member ${index + 1}`
                                                }
                                            >
                                                Remove
                                            </button>

                                        </div>

                                    )
                                )}

                            </div>

                        )}


                        {groupMembers.length > 0 && (

                            <div className="team-size-information">

                                Total visitors in this group:

                                {" "}

                                <strong>
                                    {groupMembers.length + 1}
                                </strong>

                                {" "}

                                including the primary visitor.

                            </div>

                        )}

                    </div>


                    {/* PURPOSE */}

                    <div className="form-group">

                        <label htmlFor="visitPurpose">

                            Purpose of Visit

                            <span>
                                *
                            </span>

                        </label>


                        <input
                            id="visitPurpose"
                            type="text"
                            name="purpose_of_visit"
                            value={
                                formData.purpose_of_visit
                            }
                            onChange={
                                handleChange
                            }
                            placeholder="Example: Business Meeting"
                            autoComplete="off"
                            disabled={
                                saving
                            }
                        />

                    </div>


                    {/* DEPARTMENT */}

                    <div className="form-group">

                        <label htmlFor="visitorDepartment">

                            Department

                            <span>
                                *
                            </span>

                        </label>


                        <select
                            id="visitorDepartment"
                            value={
                                selectedDepartment
                            }
                            onChange={
                                handleDepartmentChange
                            }
                            disabled={
                                loadingDepartments ||
                                saving
                            }
                        >

                            <option value="">

                                {
                                    loadingDepartments
                                        ? "Loading departments..."
                                        : "Select Department"
                                }

                            </option>


                            {departments.map(
                                department => (

                                    <option
                                        key={
                                            department.id
                                        }
                                        value={
                                            department.id
                                        }
                                    >
                                        {
                                            department.department_name
                                        }
                                    </option>

                                )
                            )}

                        </select>

                    </div>


                    {/* OFFICIAL */}

                    <div className="form-group">

                        <label htmlFor="visitorOfficial">

                            Official to Visit

                            <span>
                                *
                            </span>

                        </label>


                        <select
                            id="visitorOfficial"
                            value={
                                selectedEmployee
                            }
                            onChange={
                                handleEmployeeChange
                            }
                            disabled={
                                !selectedDepartment ||
                                loadingEmployees ||
                                saving
                            }
                        >

                            <option value="">

                                {
                                    !selectedDepartment
                                        ? "Select department first"
                                        : loadingEmployees
                                            ? "Loading employees..."
                                            : employees.length === 0
                                                ? "No employees found"
                                                : "Select Employee"
                                }

                            </option>


                            {employees.map(
                                employee => (

                                    <option
                                        key={
                                            employee.id
                                        }
                                        value={
                                            employee.id
                                        }
                                    >

                                        {
                                            employee.employee_name ||
                                            employee.name
                                        }

                                        {
                                            employee.employee_code
                                                ? ` (${employee.employee_code})`
                                                : ""
                                        }

                                    </option>

                                )
                            )}

                        </select>


                        {selectedEmployee && (

                            <div className="selected-official-info">

                                <div>

                                    Official selected:

                                    {" "}

                                    <strong>
                                        {
                                            formData.official_to_visit
                                        }
                                    </strong>

                                </div>


                                <div>

                                    Email:

                                    {" "}

                                    <strong>

                                        {
                                            formData.official_email ||
                                            "Email not available"
                                        }

                                    </strong>

                                </div>

                            </div>

                        )}

                    </div>


                    {/* VISITOR PHOTO */}

                    <div className="form-group">

                        <label>
                            Visitor Photo
                        </label>


                        {!photoPreview &&
                            !cameraOpen && (

                            <div className="photo-capture-area">

                                <button
                                    type="button"
                                    className="camera-button"
                                    onClick={
                                        openCamera
                                    }
                                    disabled={
                                        saving
                                    }
                                >

                                    <span className="camera-icon">
                                        📷
                                    </span>

                                    <span>
                                        Capture Visitor Photo
                                    </span>

                                </button>

                            </div>

                        )}


                        {cameraOpen && (

                            <div className="camera-container">

                                <video
                                    ref={
                                        videoRef
                                    }
                                    autoPlay
                                    playsInline
                                    muted
                                    controls={false}
                                    className="camera-video"
                                />


                                <div className="camera-actions">

    <button
        type="button"
        className="flip-camera-button"
        onClick={flipCamera}
    >
        <span className="flip-camera-icon">
            ↻
        </span>

        {cameraFacing === "user"
            ? "Back Camera"
            : "Front Camera"}
    </button>


    <button
        type="button"
        className="capture-button"
        onClick={capturePhoto}
    >
        Capture Photo
    </button>


    <button
        type="button"
        className="cancel-camera-button"
        onClick={closeCamera}
    >
        Cancel
    </button>

</div>

                            </div>

                        )}


                        {photoPreview &&
                            !cameraOpen && (

                            <div className="photo-preview-container">

                                <img
                                    src={
                                        photoPreview
                                    }
                                    alt="Visitor"
                                    className="photo-preview"
                                />


                                <button
                                    type="button"
                                    className="retake-photo-button"
                                    onClick={
                                        retakePhoto
                                    }
                                    disabled={
                                        saving
                                    }
                                >
                                    📷 Retake Photo
                                </button>

                            </div>

                        )}


                        <canvas
                            ref={
                                canvasRef
                            }
                            style={{
                                display: "none"
                            }}
                        />


                        {cameraError && (

                            <div
                                className="form-error"
                                role="alert"
                            >
                                {cameraError}
                            </div>

                        )}

                    </div>


                    {/* FORM ACTIONS */}

                    <div className="form-actions">

                        <button
                            type="button"
                            className="cancel-button"
                            onClick={
                                closeVisitorForm
                            }
                            disabled={
                                saving
                            }
                        >
                            Cancel
                        </button>


                        <button
                            type="submit"
                            className="save-button"
                            disabled={
                                saving ||
                                cameraOpen
                            }
                        >

                            {
                                saving
                                    ? isEditMode
                                        ? "Saving Changes..."
                                        : "Submitting..."
                                    : isEditMode
                                        ? "Save Changes"
                                        : groupMembers.length > 0
                                            ? `Submit Group Request (${groupMembers.length + 1} Visitors)`
                                            : "Submit Visitor Request"
                            }

                        </button>

                    </div>

                </form>

            </div>

        </div>

    );

}


export default VisitorForm;