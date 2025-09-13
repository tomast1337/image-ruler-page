import Toastify from "toastify-js";

class Copyable {
    constructor() {
        this.init();
    }

    init() {
        // Use event delegation to handle clicks on any element with data-copyable
        // This works for both existing and dynamically added elements
        document.addEventListener('click', (event) => {
            const target = event.target as Element;

            // Check if the clicked element or any of its parents has data-copyable
            let copyableElement = target.closest('[data-copyable]');

            if (copyableElement) {
                navigator.clipboard.writeText(copyableElement.textContent || '');
                Toastify({
                    text: "Copied to clipboard",
                    duration: 5000,
                    gravity: "bottom",
                    position: "right",
                    style: {
                        background: "var(--a6d189)",
                        color: "var(--surface1)",
                    },
                }).showToast();
            }
        });
    }
}

export {Copyable};