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
                        const year = filename.replace(/^\D+/g, "")
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

/**
 * Remove all accent from string
 *
 * @returns {!string}
 *
 * @see http://www.finalclap.com/faq/257-javascript-supprimer-remplacer-accent
 * @author finalclap
 * @since 1.0.0
 */
const removeAccent = function(city) {
    const accent = [
        /[\300-\306]/g, /[\340-\346]/g, // A, a
        /[\310-\313]/g, /[\350-\353]/g, // E, e
        /[\314-\317]/g, /[\354-\357]/g, // I, i
        /[\322-\330]/g, /[\362-\370]/g, // O, o
        /[\331-\334]/g, /[\371-\374]/g, // U, u
        /[\321]/g, /[\361]/g, // N, n
        /[\307]/g, /[\347]/g, // C, c
    ];
    const noaccent = ["A", "a", "E", "e", "I", "i", "O", "o", "U", "u", "N", "n", "C", "c"];

    let str = city;
    for (let i = 0; i < accent.length; i++) {
        str = str.replace(accent[i], noaccent[i]);
    }

    return str;
};

/**
 * Fetch psotal code.
 *
 * @param {!string} citySearched
 *
 * @returns {!Promise<object>} Returns the postalCode.
 *
 * @since 1.0.0
 * @author Axel DAVID
 */
const fetchPostalCode = async function(citySearched) {
    let goodCity = removeAccent(citySearched.replaceAll("-", " ")
        .replaceAll("'", " "));

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
                    fastMode: true,
                    step: (result, parser) => {
                        if ((
                                result.data.nom_de_la_commune.toUpperCase() === goodCity.toUpperCase()
                            )
                            || (
                                result.data.nom_de_la_commune.toUpperCase()
                                    .includes(goodCity.toUpperCase())
                            )
                            || (
                                goodCity.toUpperCase()
                                    .includes(result.data.nom_de_la_commune.toUpperCase())
                            )) {
                            // parser.abort();
                            resolve(result.data.code_postal);
                        }
                    },
                    complete: (_results, _filename) => {
                        reject(new Error("Don't find the postal code for the city '" + citySearched + "'."));
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
            "Cannot fetch data from the data directory."
            + " The list is null."
            + " Please give a list not null.",
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
            "Cannot clean data."
            + " The data is null."
            + " Please give a data not null.",
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

                const stats = {
                    payant: 0,
                    gratuit: 0,
                };
                
                if (entry.data.stats.startsWith("payant")) {
                    const slices = entry.data.stats.split(":");
                    stats[slices[0]] = parseInt(slices[1]);
                }
                if (entry.data.tags.startsWith("gratuit")) {
                    const slices = entry.data.tags.split(":");
                    stats[slices[0]] = parseInt(slices[1]);
                }

                entry.data.tags = undefined;

                entry.data.stats = stats;
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
            "Cannot aggregate data by ID."
            + " The data is null."
            + " Please give a data not null.",
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
                stats: entry.data.stats,
                status: entry.data.status,
            };
        }
    }

    results.time_spend = Date.now() - startTime;

    return results;
};

/**
 * Get the french postal code for the given city.
 *
 * @throws {TypeError} Thrown if the city is null.
 * @throws {TypeError} Thrown if the city is not a string.
 *
 * @returns {!object} Returns an object with aggregate data, and the time_spend.
 *
 * @since 1.0.0
 * @author Axel DAVID
 * @see cleanData
 * @see postalCode
 */
const postalCode = async function(city) {
    if (null === city) {
        throw new TypeError(
            "Cannot get the postal code for the city."
            + " The city is null."
            + " Please give a city not null.",
        );
    }

    if ("string" !== typeof city) {
        throw new TypeError(
            "Cannot get the postal code for the city."
            + " The city is not a string."
            + ` Type: '${typeof city}'.`
            + " Please give a city like a string.",
        );
    }

    return fetchPostalCode(city);
};

/**
 * Aggregate all data by department.
 *
 * @throws {TypeError} Thrown if the data is null.
 *
 * @returns {!object} Returns an object with aggregate data, and the time_spend.
 *
 * @since 1.0.0
 * @author Axel DAVID
 * @see cleanData
 * @see postalCode
 */
const aggregateDataByDepartment = async function(data) {
    if (null === data) {
        throw new TypeError(
            "Cannot aggregate data by ID."
            + " The data is null."
            + " Please give a data not null.",
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
                    const cp = await postalCode(entry.data.city);
                    dep = cp.substring(0, 2);
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

            if (!Number.isNaN(entry.data.stats.payant)) {
                results.data[dep][key].payant += entry.data.stats.payant;
            }
            
            if (!Number.isNaN(entry.data.stats.gratuit)) {
                results.data[dep][key].gratuit += entry.data.stats.gratuit;
            }
        }
    }
    results.time_spend = Date.now() - startTime;

    return results;
};

/**
 * Aggregate all data by city.
 *
 * @throws {TypeError} Thrown if the data is null.
 *
 * @returns {!object} Returns an object with aggregate data, and the time_spend.
 *
 * @since 1.0.0
 * @author Axel DAVID
 * @see cleanData
 */
const aggregateDataByCity = function(data) {
    if (null === data) {
        throw new TypeError(
            "Cannot aggregate data by City."
            + " The data is null."
            + " Please give a data not null.",
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
            if ("" !== city) {
                if (!results.data.hasOwnProperty(city)) {
                    results.data[city] = {};
                }
                if (!results.data[city].hasOwnProperty(key)) {
                    results.data[city][key] = {
                        payant: 0,
                        gratuit: 0,
                    };
                }

            if (!Number.isNaN(entry.data.stats.payant)) {
                results.data[city][key].payant += entry.data.stats.payant;
            }
            
            if (!Number.isNaN(entry.data.stats.gratuit)) {
                results.data[city][key].gratuit += entry.data.stats.gratuit;
            }
            }
        }
    }
    results.time_spend = Date.now() - startTime;

    return results;
};

/**
 * Aggregate all data by museum.
 *
 * @throws {TypeError} Thrown if the data is null.
 * @throws {TypeError} Thrown if the postalCode is null.
 *
 * @returns {!object} Returns an object with aggregate data, and the time_spend.
 *
 * @since 1.0.0
 * @author Axel DAVID
 * @see cleanData
 * @see postalCode
 */
const aggregateDataByMuseum = function(data) {
    if (null === data) {
        throw new TypeError(
            "Cannot aggregate data by Museum."
            + " The data is null."
            + " Please give a data not null.",
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

            if (!Number.isNaN(entry.data.stats.payant)) {
                results.data[museum][key].payant += entry.data.stats.payant;
            }
    
            if (!Number.isNaN(entry.data.stats.gratuit)) {
                results.data[museum][key].gratuit += entry.data.stats.gratuit;
            }
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
            const cleanResults = cleanData(await fetchDataList(new Set(dataFileList.list
                .filter(element => !element.includes("laposte"))),
            ));

            const timeSpend = cleanResults.time_spends;
            cleanResults.time_spends = undefined;
            console.log(cleanResults);

            const dataByID = aggregateDataByID(cleanResults);
            timeSpend["timeAggregateByID"] = dataByID.time_spend;
            console.log(dataByID);

            const dataByCity = aggregateDataByCity(cleanResults);
            timeSpend["timeAggregateByCity"] = dataByCity.time_spend;
            console.log(dataByCity);

            const dataByMuseum = aggregateDataByMuseum(cleanResults);
            timeSpend["timeAggregateByMuseum"] = dataByMuseum.time_spend;
            console.log(dataByMuseum);

            console.log("Time load: " + timeSpend.timeLoad + " ms.");
            console.log("Time merge: " + timeSpend.timeMerge + " ms.");
            console.log("Time cleanup: " + timeSpend.timeCleanup + " ms.");
            console.log("Time for aggregate by ID: " + timeSpend.timeAggregateByID + " ms.");
            console.log("Time for aggregate by city: " + timeSpend.timeAggregateByCity + " ms.");
            console.log("Time for aggregate by museum: " + timeSpend.timeAggregateByMuseum + " ms.");

            // const dataByDep = await aggregateDataByDepartment(cleanResults);
            // timeSpend["timeAggregateByDep"] = dataByDep.time_spend;
            // console.log(dataByDep);
            // console.log("Time for aggregate by department: " + timeSpend.timeAggregateByDep + " ms.");

            cleanResults.data = undefined;


            const canvas = document.createElement("canvas");
            new Chart(canvas, {
                labels: dataByMuseum.data,
                type: "line",
                datasets: [
                    {
                        data: dataByMuseum.data,
                    },
                ],
                options: {
                    scales: {
                        y: {
                            beginAtZero: true
                        },
                    },
                    plugins: {
                        colors: {
                            forceOverride: true,
                        },
                    },
                },
            });

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
