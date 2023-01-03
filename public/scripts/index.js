import {Chart} from "../dist/chart.js";
/**
 * Fetch data for the specified file.
 *
 * @param {!string} file The name of the file.
 *
 * @returns {!Promise<object>} Returns an object with an attribut of the year, like '2011'.
 * This objects contains all loaded data.
 *
 * @since 1.0.0
 * @author Axel DAVID
 */
const fetchData = async function(file) {
    if (null === file) {
        throw new TypeError("cannot fetch data for a null file.");
    }

    return new Promise((resolve, reject) => {
            const results = {};

            // Papaparse loaded from the HTML file
            Papa.parse(
                "/data/" + file,
                {
                    download: true,
                    header: true,
                    delimitersToGuess: true,
                    worker: false,
                    step: (result, _parser) => {
                        const year = result.data.year;
                        if (!results.hasOwnProperty(year)) {
                            results[year] = {
                                data: [],
                                time: Date.now(),
                            };
                        }
                        results[year].data.push(result);
                    },
                    complete: (_results, filename) => {
                        const year = filename.replace(/^\D+/g, '')
                            .substring(0, 4);
                        results[year].time = Date.now() - results[year].time;

                        resolve(results);
                    },
                    error: (error, _file) => {
                        reject(error);
                    },
                    skipEmptyLines: true,
                },
            );
        },
    );
};

const fetchPostalCode = async function() {
    return new Promise((resolve, reject) => {
            const results = {};

            // Papaparse loaded from the HTML file
            Papa.parse(
                "/data/" + "laposte_hexasmal.csv",
                {
                    download: true,
                    header: true,
                    delimitersToGuess: true,
                    worker: false,
                    step: (result, _parser) => {
                        const year = result.data.year;
                        if (!results.hasOwnProperty(year)) {
                            results[year] = {
                                data: [],
                                time: Date.now(),
                            };
                        }
                        results[year].data.push(result);
                    },
                    complete: (_results, filename) => {
                        const year = filename.replace(/^\D+/g, '')
                            .substring(0, 4);
                        results[year].time = Date.now() - results[year].time;

                        resolve(results);
                    },
                    error: (error, _file) => {
                        reject(error);
                    },
                    skipEmptyLines: true,
                },
            );
        },
    );
}

/**
 * Request data from files stored in the list.
 *
 * @param {!Set<string>} list The list of files to load from the data directory.
 *
 * @throws {TypeError} Thrown if the list is null.
 *
 * @returns {Promise<!object>} Returns the merge of all data by a year, and the time spent.
 *
 * @since 1.0.0
 * @author Axel DAVID
 */
const fetchDataList = async function(list) {
    if (null === list) {
        throw new TypeError(
            'Cannot fetch data from the data directory.'
            + ' The list is null.'
            + ' Please give a list not null.',
        );
    }

    const requests = [];
    list.forEach(file => {
        requests.push(fetchData(file));
    });

    const startLoad = Date.now();
    const results = await Promise.all(requests);
    const loadedTime = Date.now() - startLoad;

    const mergedResults = {};
    const startMerge = Date.now();
    results.forEach(year => {
        const id = Object.keys(year)[0];
        mergedResults[id] = year[id];
    });

    mergedResults["timeMerge"] = Date.now() - startMerge;
    mergedResults["timeLoad"] = loadedTime;

    return mergedResults;
};

/**
 * Remove useless information and time spend.
 *
 * @param {!object} data The data object that fetchDataList returned.
 *
 * @throws {TypeError} Thrown if data is null.
 *
 * @returns {!object} Returns an object with two attributs: data, 'time_spends'.
 *
 * @since 1.0.0
 * @author Axel DAVID
 * @see fetchDataList
 */
const cleanData = function(data) {
    if (null === data) {
        throw new TypeError(
            'Cannot clean data.'
            + ' The data is null.'
            + ' Please give a data not null.',
        );
    }

    const results = {
        data: {},
        time_spends: {
            timeCleanup: null,
            timeLoad: null,
            timeMerge: null,
            timeLoadEachEntry: {},
        },
    };

    const startTime = Date.now();
    for (const [key, value] of Object.entries(data)) {
        if ("timeLoad" === key || "timeMerge" === key) {
            results.time_spends[key] = value;
        }
        else {
            results.time_spends.timeLoadEachEntry[key] = value.time_spend;

            for (const entry of value.data) {
                if (entry.data.tags.toLowerCase().includes("musee de france")) {
                    entry.errors = undefined;
                    entry.meta = undefined;
                    entry.data.fax = undefined;
                    entry.data.phone = undefined;
                    entry.data.number = undefined;
                    entry.data.website = undefined;
                    entry.data.description = undefined;
                    entry.data.osm_id = undefined;
                    entry.data.lat = undefined;
                    entry.data.lon = undefined;
                    entry.data.tags = undefined;

                    const stats = {
                        payant: null,
                        gratuit: null,
                    };

                    for (const split of entry.data.stats.split(";")) {
                        if (split.startsWith("payant") || split.startsWith("gratuit")) {
                            const slices = split.split(":");
                            stats[slices[0]] = slices[1];
                        }
                    }

                    entry.data.stats = stats;
                }
            }

            results.data[key] = value.data;
        }
    }
    results.time_spends.timeCleanup = Date.now() - startTime;

    return results;
};

/**
 * Aggregate all data by ID.
 *
 * @throws {TypeError} Thrown if the data is null.
 *
 * @returns {!object} Returns an object with aggregate data, and the time_spend.
 *
 * @since 1.0.0
 * @author Axel DAVID
 * @see cleanData
 */
const aggregateDataByID = function(data) {
    if (null === data) {
        throw new TypeError(
            'Cannot aggregate data by ID.'
            +' The data is null.'
            +' Please give a data not null.',
        );
    }

    const results = {
        data: {},
        time_spend: null,
    };

    const startTime = Date.now();

    for (const [key, value] of Object.entries(data.data)) {
        for (const entry of value) {
            if (!results.data.hasOwnProperty(entry.data.id)) {
                results.data[entry.data.id] = {};
            }
            results.data[entry.data.id][key] = {
                id: entry.data.id,
                name: entry.data.name,
                city: entry.data.city,
                country: entry.data.country,
                country_code: entry.data.country_code,
                postal_code: entry.data.postal_code,
                street: entry.data.street,
                year: entry.data.year,
                state: entry.data.state,
                status: entry.data.status,
            };
        }
    }

    results.time_spend = Date.now() - startTime;

    return results;
};


const postalCode = function() {

}
const aggregateDataByDepartment = function(data, postalCode) {
    if (null === data) {
        throw new TypeError(
            'Cannot aggregate data by ID.'
            +' The data is null.'
            +' Please give a data not null.',
        );
    }
    if (null === postalCode) {
        throw new TypeError(
            'Cannot aggregate data by ID.'
            +' The postal code is null.'
            +' Please give a postal code not null.',
        );
    }

    const results = {
        data: {},
        time_spend: null,
    };

    const startTime = Date.now();
    for (const [key, value] of Object.entries(data.data)) {
        for (const entry of value) {
            let dep = "other";
            if ("fr" === entry.data.country_code) {
                dep = entry.data.postal_code.substring(0, 2);
                if ("" === dep) {
                    console.error(entry.data.id);
                }
            }

            if (!results.data.hasOwnProperty(dep)) {
                results.data[dep] = {};
            }
            if (!results.data[dep].hasOwnProperty(key)) {
                results.data[dep][key] = {
                    payant: 0,
                    gratuit: 0,
                };
            }

            results.data[dep][key].payant += entry.data.stats.payant;
            results.data[dep][key].gratuit += entry.data.stats.gratuit;
        }
    }
    results.time_spend = Date.now() - startTime;

    return results;
};

const aggregateDataByCity = function(data) {
    if (null === data) {
        throw new TypeError(
            'Cannot aggregate data by City.'
            +' The data is null.'
            +' Please give a data not null.',
        );
    }

    const results = {
        data: {},
        time_spend: null,
    };

    const startTime = Date.now();
    for (const [key, value] of Object.entries(data.data)) {
        for (const entry of value) {
            const city = entry.data.city.toUpperCase();

            if (!results.data.hasOwnProperty(city)) {
                results.data[city] = {};
            }
            if (!results.data[city].hasOwnProperty(key)) {
                results.data[city][key] = {
                    payant: 0,
                    gratuit: 0,
                };
            }

            results.data[city][key].payant += entry.data.stats.payant;
            results.data[city][key].gratuit += entry.data.stats.gratuit;
        }
    }
    results.time_spend = Date.now() - startTime;

    return results;
};

const aggregateDataByMuseum = function(data) {
    if (null === data) {
        throw new TypeError(
            'Cannot aggregate data by Museum.'
            +' The data is null.'
            +' Please give a data not null.',
        );
    }

    const results = {
        data: {},
        time_spend: null,
    };

    const startTime = Date.now();
    for (const [key, value] of Object.entries(data.data)) {
        for (const entry of value) {
            const museum = entry.data.name.toUpperCase();

            if (!results.data.hasOwnProperty(museum)) {
                results.data[museum] = {};
            }
            if (!results.data[museum].hasOwnProperty(key)) {
                results.data[museum][key] = {
                    payant: 0,
                    gratuit: 0,
                };
            }

            results.data[museum][key].payant += entry.data.stats.payant;
            results.data[museum][key].gratuit += entry.data.stats.gratuit;
        }
    }
    results.time_spend = Date.now() - startTime;

    return results;
};

(
    /**
     * Autoload script for the index page.
     * Request the list of files to load.
     * Check if containers 'chart-n' exist.
     *
     * @throws {Error} Thrown if a container 'chart-n' does not exist.
     * @throws {Error} Thrown if the script cannot request the list of files.
     * @throws {Error} Thrown if the container 'error' does not exist.
     *
     * @returns {Promise<void>}
     *
     * @since 1.0.0
     * @author Axel DAVID
     */
    async() => {
        const chart1 = document.getElementById("chart-1");
        if (null === chart1) {
            throw new Error(
                "Cannot show the first chart."
                + " The container 'chart-1' does not exist."
                + " Please create it.",
            );
        }

        const chart2 = document.getElementById("chart-2");
        if (null === chart2) {
            throw new Error(
                "Cannot show the first chart."
                + " The container 'chart-2' does not exist."
                + " Please create it.",
            );
        }

        const chart3 = document.getElementById("chart-3");
        if (null === chart3) {
            throw new Error(
                "Cannot show the first chart."
                + " The container 'chart-3' does not exist."
                + " Please create it.",
            );
        }

        const dataFileListFile = await fetch("/csv");
        if (dataFileListFile.ok) {
            const dataFileList = await dataFileListFile.json();
            const poste = await fetchPostalCode();
            console.log(poste);
            const cleanResults = cleanData(await fetchDataList(new Set(dataFileList.list
                .filter(element => !element.includes("laposte")))
            ));

            const timeSpend = cleanResults.time_spends;
            cleanResults.time_spends = undefined;

            const dataByID = aggregateDataByID(cleanResults);
            const dataByDep = aggregateDataByDepartment(cleanResults);
            const dataByCity = aggregateDataByCity(cleanResults);
            const dataByMuseum = aggregateDataByMuseum(cleanResults);
            console.log("Time load: " + timeSpend.timeLoad + " ms.");
            console.log("Time merge: " + timeSpend.timeMerge + " ms.");
            console.log("Time cleanup: " + timeSpend.timeCleanup + " ms.");

            console.log(cleanResults);
            console.log(dataByID);
            console.log(dataByDep);
            console.log(dataByCity);
            console.log(dataByMuseum);

            const canvas = document.createElement("canvas");
            // new Chart(canvas, {
            //     datasets: [
            //         {
            //             data: results["2001"].data,
            //         },
            //     ],
            //     options: {
            //         scales: {
            //             y: {
            //                 beginAtZero: true
            //             },
            //         },
            //         plugins: {
            //             colors: {
            //                 forceOverride: true,
            //             },
            //         },
            //     },
            // });

            chart1.appendChild(canvas);
        }
        else {
            const error = document.getElementById("error");
            if (null === error) {
                throw new Error(
                    "Cannot print the error message to the user."
                    + " The container 'error' does not exist."
                    + " Please create it.",
                );
            }

            const message = document.createElement("span");
            message.textContent = "Impossible de charger les graphiques."
                                  + " Impossible d'accéder à la liste des fichiers à charger.";
            error.appendChild(message);
        }
    }
)();
