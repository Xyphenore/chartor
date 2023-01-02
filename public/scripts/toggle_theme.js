/**
 * Update the view after switching the theme.
 *
 * @see switchTheme
 *
 * @since 1.0.0
 * @author Tailwindcss (Base)
 * @author Axel DAVID (Edit)
 */
const updateTheme = function() {
    if (!(
        'theme' in localStorage
    )) {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            localStorage.theme = "dark";
        }
        else {
            localStorage.theme = "light";
        }
    }

    if ('dark' === localStorage.theme) {
        document.documentElement.classList.add('dark');
    }
    else {
        document.documentElement.classList.remove('dark');
    }
};

/**
 * Switch the value of the theme [light, dark].
 * The function is the callback liked to toggle theme button.
 *
 * @param {!MouseEvent} event The mouse event.
 *
 * @throws {TypeError} Thrown if the event is null.
 * @throws {TypeError} Thrown if the event is not MouseEvent.
 *
 * @see MouseEvent
 * @see chartor.views.common.header.njk
 *
 * @since 1.0.0
 * @author Axel DAVID
 */
const switchTheme = function(event) {
    if (null === event) {
        throw new TypeError(
            "Cannot switch the value of the theme, with a null event. Please give an event not null.",
        );
    }
    if ("click" !== event.type) {
        throw new TypeError(
            "Cannot switch the value of the theme, with a not MouseEvent event."
            + ` Type: '${typeof event}'.`
            + " Please give a MouseEvent event.",
        );
    }

    if (0 === event.button) {
        if (!(
            'theme' in localStorage
        )) {
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                localStorage.theme = "dark";
            }
            else {
                localStorage.theme = "light";
            }
        }

        localStorage.theme = "light" === localStorage.theme ? "dark" : "light";
        updateTheme();
    }
};

(
    async() => {
        const themeButton = document.getElementById("toggle_switch_theme");
        themeButton.addEventListener('click', switchTheme);
    }
)();
