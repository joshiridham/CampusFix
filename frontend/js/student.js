document.addEventListener('DOMContentLoaded', () => {
  initStudentDashboard();
  initSubmitComplaintForm();
  initComplaintDetailsPage();
});

/* ---------------- STUDENT DASHBOARD ---------------- */
async function initStudentDashboard() {
  const container = document.getElementById('studentComplaintsContainer');
  if (!container) return;

  const user = requireAuth(['student', 'admin']);
  if (!user) return;

  const searchInput = document.getElementById('searchComplaint');
  const categoryFilter = document.getElementById('filterCategory');
  const statusFilter = document.getElementById('filterStatus');

  loadStudentComplaints();

  if (searchInput) searchInput.addEventListener('input', debounce(loadStudentComplaints, 300));
  if (categoryFilter) categoryFilter.addEventListener('change', loadStudentComplaints);
  if (statusFilter) statusFilter.addEventListener('change', loadStudentComplaints);
}

async function loadStudentComplaints() {
  const container = document.getElementById('studentComplaintsContainer');
  const statsTotal = document.getElementById('statStudentTotal');
  const statsPending = document.getElementById('statStudentPending');
  const statsInProgress = document.getElementById('statStudentInProgress');
  const statsResolved = document.getElementById('statStudentResolved');

  if (!container) return;

  try {
    container.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-muted">
          <span class="spinner-border spinner-border-sm me-2"></span>Loading complaints...
        </td>
      </tr>
    `;

    const search = document.getElementById('searchComplaint')?.value || '';
    const category = document.getElementById('filterCategory')?.value || '';
    const status = document.getElementById('filterStatus')?.value || '';

    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    if (status) params.append('status', status);

    const data = await API.request(`/complaints?${params.toString()}`);
    const statsData = await API.request('/complaints/stats');

    // Update stats counters
    if (statsData && statsData.stats) {
      if (statsTotal) statsTotal.textContent = statsData.stats.total || 0;
      if (statsPending) statsPending.textContent = statsData.stats.pending || 0;
      if (statsInProgress) statsInProgress.textContent = (statsData.stats.inProgress || 0) + (statsData.stats.assigned || 0);
      if (statsResolved) statsResolved.textContent = statsData.stats.resolved || 0;
    }

    if (!data.complaints || data.complaints.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-5 text-muted">
            <i class="bi bi-inbox fs-1 d-block mb-2 text-secondary"></i>
            No complaints found matching your criteria.
            <div class="mt-3">
              <a href="submit-complaint.html" class="btn btn-sm btn-primary-custom">Submit New Complaint</a>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    container.innerHTML = data.complaints.map(c => `
      <tr>
        <td class="fw-bold font-monospace text-primary">${c.complaintId}</td>
        <td>
          <a href="complaint-details.html?id=${c._id}" class="text-dark fw-semibold text-decoration-none hover-underline">
            ${escapeHtml(c.title)}
          </a>
          <div class="small text-muted text-truncate" style="max-width: 250px;">${escapeHtml(c.location)}</div>
        </td>
        <td><span class="badge bg-light text-dark border">${c.category}</span></td>
        <td>${getStatusBadge(c.status)}</td>
        <td>${getPriorityBadge(c.priority)}</td>
        <td class="small text-muted">${new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
        <td>
          <a href="complaint-details.html?id=${c._id}" class="btn btn-sm btn-outline-primary">
            <i class="bi bi-eye me-1"></i>View Details
          </a>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    container.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-danger">
          <i class="bi bi-exclamation-octagon me-2"></i>Failed to load complaints: ${err.message}
        </td>
      </tr>
    `;
  }
}

/* ---------------- SUBMIT COMPLAINT & DRAFT LOCALSTORAGE ---------------- */
function initSubmitComplaintForm() {
  const form = document.getElementById('submitComplaintForm');
  if (!form) return;

  const user = requireAuth(['student', 'admin']);
  if (!user) return;

  // Auto-restore draft from Local Storage
  restoreDraftFromLocalStorage();

  // Attach input listeners for auto-saving draft to Local Storage
  ['title', 'category', 'location', 'description'].forEach(fieldId => {
    const el = document.getElementById(fieldId);
    if (el) {
      el.addEventListener('input', saveDraftToLocalStorage);
      el.addEventListener('change', saveDraftToLocalStorage);
    }
  });

  const clearDraftBtn = document.getElementById('btnClearDraft');
  if (clearDraftBtn) {
    clearDraftBtn.addEventListener('click', () => {
      localStorage.removeItem('campusfix_draft');
      form.reset();
      const statusAlert = document.getElementById('draftAlert');
      if (statusAlert) {
        statusAlert.className = 'alert alert-info py-2';
        statusAlert.textContent = 'Draft cleared successfully.';
        setTimeout(() => statusAlert.classList.add('d-none'), 2000);
      }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertBox = document.getElementById('submitAlert');
    const submitBtn = document.getElementById('btnSubmitComplaint');

    const formData = new FormData(form);

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Submitting...';

      const data = await API.request('/complaints', {
        method: 'POST',
        body: formData
      });

      // Clear local storage draft upon successful submit
      localStorage.removeItem('campusfix_draft');

      showAlert(alertBox, `Complaint ${data.complaint.complaintId} submitted successfully! Redirecting...`, 'success');

      setTimeout(() => {
        window.location.href = `complaint-details.html?id=${data.complaint._id}`;
      }, 1000);

    } catch (err) {
      showAlert(alertBox, err.message || 'Error submitting complaint.', 'danger');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-send me-1"></i>Submit Complaint';
    }
  });
}

function saveDraftToLocalStorage() {
  const draft = {
    title: document.getElementById('title')?.value || '',
    category: document.getElementById('category')?.value || '',
    location: document.getElementById('location')?.value || '',
    description: document.getElementById('description')?.value || '',
    latitude: document.getElementById('latitude')?.value || '',
    longitude: document.getElementById('longitude')?.value || '',
    savedAt: new Date().toISOString()
  };
  localStorage.setItem('campusfix_draft', JSON.stringify(draft));

  const draftAlert = document.getElementById('draftAlert');
  if (draftAlert) {
    draftAlert.classList.remove('d-none');
    draftAlert.className = 'alert alert-light border py-2 text-muted small d-flex justify-content-between align-items-center';
    draftAlert.innerHTML = `
      <span><i class="bi bi-floppy me-1 text-primary"></i>Draft auto-saved to Local Storage at ${new Date().toLocaleTimeString()}</span>
      <button type="button" class="btn btn-link btn-sm text-danger text-decoration-none p-0" id="btnClearDraft">Clear</button>
    `;
  }
}

function restoreDraftFromLocalStorage() {
  const draftStr = localStorage.getItem('campusfix_draft');
  if (!draftStr) return;

  try {
    const draft = JSON.parse(draftStr);
    if (draft.title && document.getElementById('title')) document.getElementById('title').value = draft.title;
    if (draft.category && document.getElementById('category')) document.getElementById('category').value = draft.category;
    if (draft.location && document.getElementById('location')) document.getElementById('location').value = draft.location;
    if (draft.description && document.getElementById('description')) document.getElementById('description').value = draft.description;
    if (draft.latitude && document.getElementById('latitude')) document.getElementById('latitude').value = draft.latitude;
    if (draft.longitude && document.getElementById('longitude')) document.getElementById('longitude').value = draft.longitude;

    const draftAlert = document.getElementById('draftAlert');
    if (draftAlert) {
      draftAlert.classList.remove('d-none');
      draftAlert.className = 'alert alert-info py-2 text-dark small';
      draftAlert.innerHTML = `<i class="bi bi-arrow-counterclockwise me-1"></i>Restored saved draft from Local Storage.`;
    }
  } catch (e) {}
}

/* ---------------- COMPLAINT DETAILS PAGE ---------------- */
async function initComplaintDetailsPage() {
  const detailContainer = document.getElementById('complaintDetailView');
  if (!detailContainer) return;

  const user = requireAuth();
  if (!user) return;

  const urlParams = new URLSearchParams(window.location.search);
  const complaintId = urlParams.get('id');

  if (!complaintId) {
    detailContainer.innerHTML = '<div class="alert alert-warning">No complaint ID specified in URL.</div>';
    return;
  }

  try {
    const data = await API.request(`/complaints/${complaintId}`);
    const c = data.complaint;

    const formattedDate = new Date(c.createdAt).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    const isStaffOrAdmin = user.role === 'admin' || user.role === 'staff';

    detailContainer.innerHTML = `
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <a href="javascript:history.back()" class="text-muted text-decoration-none small">
            <i class="bi bi-arrow-left me-1"></i>Back
          </a>
          <h2 class="h3 fw-bold mb-1 mt-1">${escapeHtml(c.title)}</h2>
          <div class="d-flex align-items-center gap-2 text-muted small">
            <span class="fw-bold text-primary font-monospace fs-6">${c.complaintId}</span> &bull;
            <span>Submitted on ${formattedDate}</span>
          </div>
        </div>
        <div class="d-flex align-items-center gap-2">
          ${getStatusBadge(c.status)}
          ${getPriorityBadge(c.priority)}
        </div>
      </div>

      <div class="row g-4">
        <!-- Main Details Left -->
        <div class="col-lg-8">
          <div class="glass-card p-4 mb-4">
            <h5 class="fw-bold mb-3 border-bottom pb-2"><i class="bi bi-file-text me-2 text-primary"></i>Problem Description</h5>
            <p class="text-secondary style-description">${escapeHtml(c.description).replace(/\n/g, '<br>')}</p>

            <h5 class="fw-bold mb-3 border-bottom pb-2 mt-4"><i class="bi bi-geo-alt me-2 text-danger"></i>Location Details</h5>
            <p class="mb-2 fw-semibold">${escapeHtml(c.location)}</p>
            ${c.latitude && c.longitude ? `
              <div class="p-3 bg-light rounded-3 border d-flex align-items-center justify-content-between">
                <div>
                  <span class="badge bg-secondary font-monospace">GPS Coordinates</span>
                  <div class="small text-muted mt-1 font-monospace">Lat: ${c.latitude}, Lng: ${c.longitude}</div>
                </div>
                <a href="https://maps.google.com/?q=${c.latitude},${c.longitude}" target="_blank" class="btn btn-sm btn-outline-success">
                  <i class="bi bi-map me-1"></i>Open Google Maps
                </a>
              </div>
            ` : ''}

            ${c.image ? `
              <h5 class="fw-bold mb-3 border-bottom pb-2 mt-4"><i class="bi bi-image me-2 text-info"></i>Uploaded Complaint Evidence</h5>
              <div class="text-center p-2 bg-light rounded border">
                <img src="${c.image}" alt="Evidence" class="img-fluid rounded shadow-sm" style="max-height:360px; object-fit:contain;">
              </div>
            ` : ''}

            ${c.resolutionProof ? `
              <div class="mt-4 p-3 bg-success bg-opacity-10 border border-success rounded-3">
                <h5 class="fw-bold text-success mb-2"><i class="bi bi-check-circle-fill me-2"></i>Staff Resolution Proof Uploaded</h5>
                ${c.staffRemarks ? `<p class="mb-3 text-dark"><strong>Staff Remarks:</strong> ${escapeHtml(c.staffRemarks)}</p>` : ''}
                <div class="text-center bg-white p-2 rounded border">
                  <img src="${c.resolutionProof}" alt="Resolution Proof" class="img-fluid rounded shadow-sm" style="max-height:360px; object-fit:contain;">
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Status Timeline History -->
          <div class="glass-card p-4">
            <h5 class="fw-bold mb-4 border-bottom pb-2"><i class="bi bi-clock-history me-2 text-warning"></i>Complaint Progress Timeline</h5>
            <div class="timeline ms-2">
              ${c.statusHistory && c.statusHistory.length > 0 ? c.statusHistory.map(h => `
                <div class="timeline-item">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="fw-bold text-dark">${getStatusBadge(h.status)}</span>
                    <span class="small text-muted">${new Date(h.timestamp).toLocaleString()}</span>
                  </div>
                  <div class="small text-secondary">${escapeHtml(h.remarks || 'Status updated.')}</div>
                  ${h.updatedBy ? `<div class="small text-muted mt-1">Updated by: <strong>${escapeHtml(h.updatedBy.name || 'System')}</strong> (${h.updatedBy.role || 'user'})</div>` : ''}
                </div>
              `).join('') : '<p class="text-muted">No timeline history recorded yet.</p>'}
            </div>
          </div>
        </div>

        <!-- Meta Sidebar Right -->
        <div class="col-lg-4">
          <div class="glass-card p-4 mb-4">
            <h5 class="fw-bold mb-3 border-bottom pb-2">Complaint Info</h5>
            
            <div class="mb-3">
              <label class="text-muted small d-block mb-1">Category</label>
              <span class="fw-semibold text-dark fs-6">${c.category}</span>
            </div>

            <div class="mb-3">
              <label class="text-muted small d-block mb-1">Submitted By</label>
              <div class="fw-semibold">${escapeHtml(c.submittedBy ? c.submittedBy.name : 'Unknown Student')}</div>
              <div class="small text-muted">${escapeHtml(c.submittedBy ? c.submittedBy.email : '')}</div>
            </div>

            <div class="mb-3">
              <label class="text-muted small d-block mb-1">Assigned Department</label>
              <div class="fw-semibold text-dark">${c.department ? escapeHtml(c.department.name) : '<span class="text-muted fst-italic">Not Assigned Yet</span>'}</div>
            </div>

            <div class="mb-3">
              <label class="text-muted small d-block mb-1">Assigned Staff Member</label>
              <div class="fw-semibold text-dark">${c.assignedTo ? escapeHtml(c.assignedTo.name) + ' (' + c.assignedTo.email + ')' : '<span class="text-muted fst-italic">Unassigned</span>'}</div>
            </div>

            ${isStaffOrAdmin ? `
              <hr class="my-3">
              <div class="d-grid gap-2">
                ${user.role === 'admin' ? `
                  <a href="admin-dashboard.html" class="btn btn-primary-custom">
                    <i class="bi bi-gear-fill me-1"></i>Manage in Admin Control Center
                  </a>
                ` : ''}
                ${user.role === 'staff' ? `
                  <a href="staff-dashboard.html" class="btn btn-success">
                    <i class="bi bi-check2-square me-1"></i>Manage in Staff Portal
                  </a>
                ` : ''}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;

  } catch (err) {
    detailContainer.innerHTML = `<div class="alert alert-danger"><i class="bi bi-exclamation-triangle-fill me-2"></i>${err.message}</div>`;
  }
}
