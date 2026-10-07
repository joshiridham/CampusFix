document.addEventListener('DOMContentLoaded', () => {
  initStaffDashboard();
});

let currentStaffComplaintId = null;

async function initStaffDashboard() {
  const container = document.getElementById('staffComplaintsContainer');
  if (!container) return;

  const user = requireAuth(['staff', 'admin']);
  if (!user) return;

  // Display Staff Info Banner
  const staffInfoBanner = document.getElementById('staffInfoBanner');
  if (staffInfoBanner && user) {
    staffInfoBanner.innerHTML = `
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <h4 class="fw-bold mb-1"><i class="bi bi-tools me-2 text-primary"></i>Staff Work Portal</h4>
          <p class="text-muted mb-0">Welcome, <strong>${escapeHtml(user.name)}</strong> ${user.department ? `(${escapeHtml(user.department.name || '')})` : ''}</p>
        </div>
        <span class="badge bg-primary px-3 py-2 fs-6">Assigned Technician</span>
      </div>
    `;
  }

  loadStaffComplaints();

  const searchInput = document.getElementById('staffSearch');
  const statusFilter = document.getElementById('staffFilterStatus');

  if (searchInput) searchInput.addEventListener('input', debounce(loadStaffComplaints, 300));
  if (statusFilter) statusFilter.addEventListener('change', loadStaffComplaints);

  initStaffModalForm();
}

async function loadStaffComplaints() {
  const container = document.getElementById('staffComplaintsContainer');
  if (!container) return;

  try {
    container.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-muted">
          <span class="spinner-border spinner-border-sm me-2"></span>Loading assigned tasks...
        </td>
      </tr>
    `;

    const search = document.getElementById('staffSearch')?.value || '';
    const status = document.getElementById('staffFilterStatus')?.value || '';

    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);

    const data = await API.request(`/complaints?${params.toString()}`);
    const statsData = await API.request('/complaints/stats');

    // Update Counters
    if (statsData && statsData.stats) {
      if (document.getElementById('statStaffTotal')) document.getElementById('statStaffTotal').textContent = statsData.stats.total || 0;
      if (document.getElementById('statStaffAssigned')) document.getElementById('statStaffAssigned').textContent = (statsData.stats.assigned || 0);
      if (document.getElementById('statStaffInProgress')) document.getElementById('statStaffInProgress').textContent = (statsData.stats.inProgress || 0);
      if (document.getElementById('statStaffResolved')) document.getElementById('statStaffResolved').textContent = (statsData.stats.resolved || 0);
    }

    if (!data.complaints || data.complaints.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-5 text-muted">
            <i class="bi bi-check-circle-fill fs-2 d-block mb-2 text-success"></i>
            No active assigned complaints found. You're all caught up!
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
          <div class="small text-muted text-truncate" style="max-width: 240px;">
            <i class="bi bi-geo-alt me-1"></i>${escapeHtml(c.location)}
          </div>
        </td>
        <td><span class="badge bg-light text-dark border">${c.category}</span></td>
        <td>${getStatusBadge(c.status)}</td>
        <td>${getPriorityBadge(c.priority)}</td>
        <td class="small text-muted">${new Date(c.createdAt).toLocaleDateString()}</td>
        <td>
          <div class="btn-group btn-group-sm">
            <a href="complaint-details.html?id=${c._id}" class="btn btn-outline-secondary">
              <i class="bi bi-eye"></i> Details
            </a>
            <button class="btn btn-success" onclick="openStaffModal('${c._id}')">
              <i class="bi bi-arrow-repeat me-1"></i>Update Status
            </button>
          </div>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    container.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-danger">
          Error loading assigned complaints: ${err.message}
        </td>
      </tr>
    `;
  }
}

async function openStaffModal(complaintId) {
  currentStaffComplaintId = complaintId;
  const modalEl = document.getElementById('staffUpdateModal');
  if (!modalEl) return;

  const bsModal = new bootstrap.Modal(modalEl);

  try {
    const data = await API.request(`/complaints/${complaintId}`);
    const c = data.complaint;

    document.getElementById('staffModalId').textContent = c.complaintId;
    document.getElementById('staffModalTitle').textContent = c.title;

    document.getElementById('staffStatusSelect').value = c.status === 'Resolved' ? 'Resolved' : 'In Progress';
    document.getElementById('staffRemarksInput').value = c.staffRemarks || '';
    document.getElementById('resolutionProofInput').value = '';

    bsModal.show();

  } catch (err) {
    alert('Failed to open modal: ' + err.message);
  }
}

function initStaffModalForm() {
  const form = document.getElementById('staffUpdateForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentStaffComplaintId) return;

    const alertBox = document.getElementById('staffModalAlert');
    const submitBtn = document.getElementById('btnSaveStaffUpdate');

    const formData = new FormData(form);

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Updating...';

      await API.request(`/complaints/${currentStaffComplaintId}/staff-update`, {
        method: 'PUT',
        body: formData
      });

      showAlert(alertBox, 'Complaint status & resolution proof updated!', 'success');

      setTimeout(() => {
        const modalEl = document.getElementById('staffUpdateModal');
        const bsModal = bootstrap.Modal.getInstance(modalEl);
        if (bsModal) bsModal.hide();
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Save Update';
        loadStaffComplaints();
      }, 800);

    } catch (err) {
      showAlert(alertBox, err.message || 'Error updating status', 'danger');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Save Update';
    }
  });
}
