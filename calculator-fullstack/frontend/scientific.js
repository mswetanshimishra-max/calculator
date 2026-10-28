// Scientific Calculator Functions
//
// Number, operator, "=" and clear buttons are wired up in calculator.js; when the
// Scientific tab is active the Calculator builds a free-form expression and sends it
// to the scientific API. This file only handles the scientific-specific buttons.

document.querySelectorAll('.btn-scientific').forEach(button => {
    button.addEventListener('click', () => {
        if (button.dataset.action === 'deg-rad') {
            toggleDegreeRadian();
            return;
        }

        const value = button.dataset.value;
        if (value === '^') {
            calculator.setOperator('^');
        } else {
            // sin(  cos(  tan(  log(  ln(  sqrt(  abs(  (  )  π  e
            calculator.appendToken(value);
        }
    });
});

// Toggle between degree and radian mode
function toggleDegreeRadian() {
    calculator.isDegreeMode = !calculator.isDegreeMode;
    const btn = document.querySelector('.btn-scientific[data-action="deg-rad"]');
    btn.textContent = calculator.isDegreeMode ? 'DEG' : 'RAD';
}
