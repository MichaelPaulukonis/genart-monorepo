# p5-utils: Validation and Feedback

The `@genart/p5-utils` library has been extended to include utilities for file validation and user feedback.

## `validateImageFile(file)`

This function provides whitelist-based validation for image files. It checks both the file's MIME type and file extension to ensure it is a supported image format.

### Supported Formats

-   **MIME Types**: `image/jpeg`, `image/png`, `image/gif`, `image/webp`, `image/bmp`
-   **File Extensions**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.bmp`

### Usage

```javascript
import { validateImageFile } from '@genart/p5-utils';

function handleFile(file) {
  const validation = validateImageFile(file);

  if (!validation.valid) {
    // Handle invalid file
    console.error(validation.message);
    return;
  }

  // Proceed with valid file
}
```

## `showErrorMessage(message, duration)`

This function displays a temporary, non-blocking error message to the user. The message appears at the top of the screen and fades out after a specified duration.

### Parameters

-   `message` (string): The error message to display.
-   `duration` (number, optional): The duration in milliseconds before the message starts to fade out. Defaults to `3000`.

### Usage

```javascript
import { showErrorMessage } from '@genart/p5-utils';

showErrorMessage('This is an error message.');
```
