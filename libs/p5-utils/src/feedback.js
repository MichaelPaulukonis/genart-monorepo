/**
 * Displays a temporary, user-friendly error message in the DOM.
 * The message fades out after a few seconds.
 * @param {string} message - The error message to display.
 * @param {number} duration - The duration in milliseconds before the message starts to fade out.
 */
export function showErrorMessage(message, duration = 3000) {
  let errorMessageElement = document.getElementById('error-message');

  if (!errorMessageElement) {
    errorMessageElement = document.createElement('div');
    errorMessageElement.id = 'error-message';
    errorMessageElement.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #ff4d4d; /* Red background for errors */
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      font-family: sans-serif;
      font-size: 16px;
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.5s ease-in-out;
    `;
    document.body.appendChild(errorMessageElement);
  }

  errorMessageElement.textContent = message;
  errorMessageElement.style.opacity = '1';

  setTimeout(() => {
    errorMessageElement.style.opacity = '0';
  }, duration);
}
