/**
 * Update the view after switching the state of the menu.
 *
 * @throws {Error} Thrown if the main menu 'navbar-default' does not exist.
 *
 * @see switchMenuState
 *
 * @since 1.0.0
 * @author Tailwindcss (Base)
 * @author Axel DAVID (Edit)
 */
const updateMenu = function() {
    const burgerMenu = document.getElementById("navbar-default");
    if (null === burgerMenu) {
        throw new Error(
            "Cannot open the burger menu."
            + " The burger menu does not exist."
            + " Please add the burger menu with the ID 'navbar-default'.",
        );
    }

    if (!(
        'mainMenuState' in localStorage
    )) {
        localStorage.mainMenuState = "close";
    }

    if ("close" === localStorage.mainMenuState) {
        burgerMenu.classList.add("hidden");
    }
    else {
        burgerMenu.classList.remove("hidden");
    }
};

/**
 * Open or close the burger menu.
 *
 * @param {!MouseEvent} event Click event.
 *
 * @throws {TypeError} Thrown if the event is null.
 * @throws {TypeError} Thrown if the event is not a 'click' event.
 * @throws {Error} Thrown if the burger menu 'navbar-default' does not exist.
 *
 * @since 1.0.0
 * @author Axel DAVID
 */
const switchMenuState = function(event) {
    if (null === event) {
        throw new TypeError(
            "Cannot change the state of the burger menu."
            + " The given event is null."
            + " Please give an event not null.",
        );
    }

    if ("click" !== event.type) {
        throw new TypeError(
            "Cannot change the state of the burger menu."
            + " The given event is not a click event."
            + ` Type: '${event.type}'.`
            + " Please give a click event.",
        );
    }

    const burgerMenu = document.getElementById("navbar-default");
    if (null === burgerMenu) {
        throw new Error(
            "Cannot open the burger menu."
            + " The burger menu does not exist."
            + " Please add the burger menu with the ID 'navbar-default'.",
        );
    }

    if (0 === event.button) {
        if (!(
            'mainMenuState' in localStorage
        )) {
            localStorage.mainMenuState = "close";
        }

        if ("close" === localStorage.mainMenuState) {
            localStorage.mainMenuState = "open";
        }
        else {
            localStorage.mainMenuState = "close";
        }

        updateMenu();
    }
};

/**
 * Reset the state of the main menu so 'close'.
 *
 * @author Axel DAVID
 * @since 1.0.0
 * @see updateMenu
 * @see switchMenuState
 */
const resetMenuState = function() {
    localStorage.mainMenuState = "close";
};

(
    /**
     * Autoload script for the burger menu.
     *
     * @throws {Error} Thrown if the button 'burgerMenuButton' does not exist.
     * @throws {Error} Thrown if the burger menu 'navbar-default' does not exist.
     *
     * @returns {Promise<void>}
     *
     * @since 1.0.0
     * @author Axel DAVID
     * @see switchMenuState
     * @see updateMenu
     */
    async() => {
        const menuButton = document.getElementById("burgerMenuButton");
        if (null === menuButton) {
            throw new Error(
                "Cannot open the burger menu."
                + " The burger button does not exist."
                + "Please add a button with the ID 'burgerMenuButton'.");
        }

        const burgerMenu = document.getElementById("navbar-default");
        if (null === burgerMenu) {
            throw new Error(
                "Cannot open the burger menu."
                + " The burger menu does not exist."
                + " Please add the burger menu with the ID 'navbar-default'.",
            );
        }

        menuButton.addEventListener('click', switchMenuState);
        resetMenuState();
        updateMenu();
    }
)();
