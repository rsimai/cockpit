// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function() {
    // Get references to the HTML elements
    const number1Input = document.getElementById("number1");
    const number2Input = document.getElementById("number2");
    const calculateBtn = document.getElementById("calculateBtn");
    const resultParagraph = document.getElementById("result");

    // Function to perform the calculation
    function calculateProduct() {
        // Get the values from the input fields and convert them to numbers
        const num1 = parseFloat(number1Input.value) || 0;
        const num2 = parseFloat(number2Input.value) || 0;

        // Calculate the product
        const product = num1 * num2;

        // Display the result
        resultParagraph.innerHTML = `The product of ${num1} and ${num2} is: <span id="product">${product}</span>`;
    }

    // Add a click event listener to the button
    calculateBtn.addEventListener("click", calculateProduct);
});

// Send a "ready" message to Cockpit
cockpit.ready();
