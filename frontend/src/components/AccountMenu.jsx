import {
    useEffect,
    useRef,
    useState
} from "react";

import "./AccountMenu.css";


function AccountMenu({
    name,
    role,
    onLogout,
    className = ""
}) {

    const [open, setOpen] =
        useState(false);

    const menuRef =
        useRef(null);

    const displayName =
        name || "User";

    const displayRole =
        role || "Account";

    const initial =
        displayName
            .trim()
            .charAt(0)
            .toUpperCase() || "U";


    useEffect(() => {

        if (!open) {
            return undefined;
        }


        const handlePointerDown = event => {

            if (
                menuRef.current &&
                !menuRef.current.contains(
                    event.target
                )
            ) {
                setOpen(false);
            }

        };


        const handleKeyDown = event => {

            if (event.key === "Escape") {
                setOpen(false);
            }

        };


        document.addEventListener(
            "pointerdown",
            handlePointerDown
        );

        document.addEventListener(
            "keydown",
            handleKeyDown
        );


        return () => {

            document.removeEventListener(
                "pointerdown",
                handlePointerDown
            );

            document.removeEventListener(
                "keydown",
                handleKeyDown
            );

        };

    }, [open]);


    const handleLogout = () => {

        setOpen(false);
        onLogout();

    };


    return (

        <div
            className={`account-menu ${className}`.trim()}
            ref={menuRef}
        >

            <button
                type="button"
                className="account-menu-trigger"
                onClick={() =>
                    setOpen(previous => !previous)
                }
                aria-label={`Open account menu for ${displayName}`}
                aria-expanded={open}
                aria-haspopup="menu"
            >

                <span className="account-menu-avatar">
                    {initial}
                </span>

                <span className="account-menu-trigger-text">

                    <strong>
                        {displayName}
                    </strong>

                    <span>
                        {displayRole}
                    </span>

                </span>

                <span
                    className="account-menu-chevron"
                    aria-hidden="true"
                >
                    ▾
                </span>

            </button>


            {open && (

                <div
                    className="account-menu-panel"
                    role="menu"
                >

                    <div className="account-menu-identity">

                        <strong>
                            {displayName}
                        </strong>

                        <span>
                            {displayRole}
                        </span>

                    </div>

                    <button
                        type="button"
                        className="account-menu-logout"
                        onClick={handleLogout}
                        role="menuitem"
                    >
                        <span aria-hidden="true">
                            ↪
                        </span>

                        Log out
                    </button>

                </div>

            )}

        </div>

    );

}


export default AccountMenu;
