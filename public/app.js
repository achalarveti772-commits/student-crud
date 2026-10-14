
function showSection(sectionId) {
    const sections = document.querySelectorAll('.panel');

    sections.forEach(section => {
        section.hidden = true;
    });

    document.getElementById(sectionId).hidden = false;
}
