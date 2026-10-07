// HTML5 Drag & Drop File Upload Module

function initDragAndDrop() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('complaintImage');
  const previewContainer = document.getElementById('previewContainer');
  const imagePreview = document.getElementById('imagePreview');
  const fileNameDisplay = document.getElementById('fileNameDisplay');
  const btnRemoveImage = document.getElementById('btnRemoveImage');
  const dropzoneError = document.getElementById('dropzoneError');

  if (!dropzone || !fileInput) return;

  // Prevent default drag behaviors
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, preventDefaults, false);
    document.body.addEventListener(eventName, preventDefaults, false);
  });

  // Highlight dropzone on dragover
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, () => dropzone.classList.add('dragover'), false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, () => dropzone.classList.remove('dragover'), false);
  });

  // Handle dropped files
  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      handleFiles(files[0]);
    }
  }, false);

  // Click dropzone to trigger input
  dropzone.addEventListener('click', (e) => {
    if (e.target.id !== 'btnRemoveImage' && !e.target.closest('#btnRemoveImage')) {
      fileInput.click();
    }
  });

  // Handle normal file input selection
  fileInput.addEventListener('change', (e) => {
    if (fileInput.files.length > 0) {
      handleFiles(fileInput.files[0]);
    }
  });

  // Remove selected image
  if (btnRemoveImage) {
    btnRemoveImage.addEventListener('click', (e) => {
      e.stopPropagation();
      resetFileSelection();
    });
  }

  function handleFiles(file) {
    clearError();

    // Validate type
    if (!file.type.startsWith('image/')) {
      showError('Invalid file type! Please upload an image file (PNG, JPG, JPEG, WEBP).');
      resetFileSelection();
      return;
    }

    // Validate size (5MB = 5 * 1024 * 1024)
    if (file.size > 5 * 1024 * 1024) {
      showError('File size exceeds 5 MB limit. Please select a smaller image.');
      resetFileSelection();
      return;
    }

    // Assign file to input
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;

    // Display Preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (imagePreview) imagePreview.src = e.target.result;
      if (fileNameDisplay) fileNameDisplay.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      if (previewContainer) previewContainer.classList.remove('d-none');
    };
    reader.readAsDataURL(file);
  }

  function resetFileSelection() {
    fileInput.value = '';
    if (previewContainer) previewContainer.classList.add('d-none');
    if (imagePreview) imagePreview.src = '';
    if (fileNameDisplay) fileNameDisplay.textContent = '';
  }

  function showError(msg) {
    if (dropzoneError) {
      dropzoneError.textContent = msg;
      dropzoneError.classList.remove('d-none');
    }
  }

  function clearError() {
    if (dropzoneError) {
      dropzoneError.textContent = '';
      dropzoneError.classList.add('d-none');
    }
  }

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }
}

document.addEventListener('DOMContentLoaded', initDragAndDrop);
