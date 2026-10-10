const links = [...document.querySelectorAll(".side a")];
const sections = links
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

function markCurrent() {
  const line = window.scrollY + 140;
  let current = sections[0];
  for (const section of sections) {
    if (section.offsetTop <= line) current = section;
  }
  links.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${current.id}`);
  });
}

document.addEventListener("scroll", markCurrent, { passive: true });
markCurrent();
