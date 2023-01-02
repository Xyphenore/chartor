(
    /**
     * Autoload script for the source page.
     *
     * @throws {Error} Thrown if the list 'data_source' does not exist.
     * @throws {Error} Thrown if the file 'csv.json' cannot be requested from the server.
     *
     * @returns {Promise<void>}
     *
     * @since 1.0.0
     * @author Axel DAVID
     */
    async() => {
        const sourceList = document.getElementById("data_source");
        if (null === sourceList) {
            throw new Error(
                "Cannot show the list of data sources."
                + " The list with the ID 'data_source' does not exist."
                + " Please add a list with the ID 'data_source'.",
            );
        }

        const dataFileListFile = await fetch("/csv");
        if (!dataFileListFile.ok) {
            throw new Error(
                "Cannot show the list of data sources."
                + " Cannot request the list."
                + " Please add the list to the available file.",
            );
        }

        const dataFileList = await dataFileListFile.json();
        dataFileList.list.forEach(file => {
            const li = document.createElement("li");
            const span = document.createElement("span");
            span.textContent = " - ";

            const link = document.createElement("a");
            link.href = "/data/" + file;
            link.text = file;
            link.classList.add("underline");

            li.appendChild(span);
            li.appendChild(link);

            sourceList.appendChild(li);
        });
    }
)();
