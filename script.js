const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const searchMessage = document.getElementById("searchMessage");

searchButton.addEventListener("click", function () {
    const subject = searchInput.value.trim();

    if (subject === "") {
        searchMessage.textContent = "Please enter a subject to search.";
    } else {
        const cards = document.querySelectorAll(".card");
        let found = false;

        cards.forEach(function (card) {
            const matches = card.textContent
                .toLowerCase()
                .includes(subject.toLowerCase());

            card.style.display = matches ? "" : "none";

            if (matches) {
                found = true;
            }
        });

        searchMessage.textContent = found
            ? "Here are your matching subjects!"
            : "No matching subjects found. Try Java, Web Development, or Database.";
    }
});

document.querySelectorAll(".exploreButton").forEach(function (button) {
    button.addEventListener("click", function () {
        const subject = this.parentElement.querySelector("h3").textContent;
        alert("Study notes for " + subject + " will be available here soon!");
    });
});