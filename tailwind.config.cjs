/** @type {import('tailwindcss').Config} */

module.exports = {
    content: [
        "./views/**/*.njk",
        "./public/scripts/**/*.js",
    ],
    theme: {
        container: {
            center: true,
        },
        extend: {},
    },
    plugins: [],
    darkMode: "class",
};
