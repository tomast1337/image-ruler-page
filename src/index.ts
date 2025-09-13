import { ImageRuler } from "./imageRuler";
import { Copyable } from "./copyable";
import Toastify from 'toastify-js'

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ImageRuler();
    new Copyable();
    Toastify({
        text: "Welcome to the Image Ruler",
        duration: 5000,
        gravity: "bottom",
        position: "right",
        style: {
            background: "var(--rosewater)",
            color: "var(--surface1)",
        },
    }).showToast();
});