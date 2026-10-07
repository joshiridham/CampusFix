document.addEventListener('DOMContentLoaded', () => {
  initAdminDashboard();
});

let currentAdminComplaintId = null;
let cachedDepartments = [];
let cachedStaff = [];

async function initAdminDashboard() {
  const container = document.getElementById('adminComplaintsContainer');
  if (!container) return;

  const user = requireAuth(['admin']);
  if (!user) return;

  loadDepartmentsAndStaff();
  loadAdminComplaints();

  const searchInput = document.getElementById('adminSearch');
  const statusFilter = document.getElementById('adminFilterStatus');
  const categoryFilter = document.getElementById('adminFilterCategory');

  if (searchInput) searchInput.addEventListener('input', debounce(loadAdminComplaints, 300));
  if (statusFilter) statusFilter.addEventListener('change', loadAdminComplaints);
  if (categoryFilter) categoryFilter.addEventListener('change', loadAdminComplaints);

  initAdminModalForm();
}

async function loadDepartmentsAndStaff() {
  try {
    const data = await API.request('/departments');
    cachedDepartments = data.departments || [];
    cachedStaff = data.staff || [];
  } catch (err) {
    console.error('Error fetching departments list:', err);
  }
}

async function loadAdminComplaints() {
  const container = document.getElementById('adminComplaintsContainer');
  if (!container) return;

  try {
    container.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-4 text-muted">
          <span class="spinner-border spinner-border-sm me-2"></span>Loading all campus complaints...
        </td>
      </tr>
    `;

    const search = document.getElementById('adminSearch')?.value || '';
    const status = document.getElementById('adminFilterStatus')?.value || '';
    const category = document.getElementById('adminFilterCategory')?.value || '';

    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (category) params.append('category', category);

    const data = await API.request(`/complaints?${params.toString()}`);
    const statsData = await API.request('/complaints/stats');

    // Update Counters
    if (statsData && statsData.stats) {
      document.getElementById('statTotal').textContent = statsData.stats.total || 0;
      document.getElementById('statPending').textContent = statsData.stats.pending || 0;
      document.getElementById('statInProgress').textContent = (statsData.stats.inProgress || 0) + (statsData.stats.assigned || 0);
      document.getElementById('statResolved').textContent = statsData.stats.resolved || 0;
      document.getElementById('statRejected').textContent = statsData.stats.rejected || 0;
    }

    if (!data.complaints || data.complaints.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-5 text-muted">
            <i class="bi bi-inbox fs-2 d-block mb-2 text-secondary"></i>
            No complaints found.
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
          <div class="small text-muted text-truncate" style="max-width: 220px;">
            <i class="bi bi-geo-alt me-1"></i>${escapeHtml(c.location)}
          </div>
        </td>
        <td>
          <div class="small fw-semibold">${escapeHtml(c.submittedBy ? c.submittedBy.name : 'Unknown')}</div>
          <div class="small text-muted">${escapeHtml(c.submittedBy ? c.submittedBy.email : '')}</div>
        </td>
        <td><span class="badge bg-light text-dark border">${c.category}</span></td>
        <td>${getStatusBadge(c.status)}</td>
        <td>${getPriorityBadge(c.priority)}</td>
        <td class="small">
          ${c.assignedTo ? `<span class="badge bg-info text-dark">${escapeHtml(c.assignedTo.name)}</span>` : '<span class="text-muted fst-italic">Unassigned</span>'}
        </td>
        <td>
          <div class="btn-group btn-group-sm">
            <a href="complaint-details.html?id=${c._id}" class="btn btn-outline-secondary" title="View Details">
              <i class="bi bi-eye"></i>
            </a>
            <button class="btn btn-primary" onclick="openAdminModal('${c._id}')" title="Assign / Verify">
              <i class="bi bi-pencil-square me-1"></i>Manage
            </button>
          </div>
        </td>
      </tr>
    `).join('');

  } catch (err) {
    container.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-4 text-danger">
          Error loading complaints: ${err.message}
        </td>
      </tr>
    `;
  }
}

async function openAdminModal(complaintId) {
  currentAdminComplaintId = complaintId;
  const modalEl = document.getElementById('adminManageModal');
  if (!modalEl) return;

  const bsModal = new bootstrap.Modal(modalEl);

  try {
    const data = await API.request(`/complaints/${complaintId}`);
    const c = data.complaint;

    document.getElementById('modalComplaintIdDisplay').textContent = c.complaintId;
    document.getElementById('modalComplaintTitle').textContent = c.title;
    document.getElementById('modalComplaintLocation').textContent = c.location;

    // Populate Department Select
    const deptSelect = document.getElementById('modalDepartmentSelect');
    deptSelect.innerHTML = '<option value="">-- Select Department --</option>' + 
      cachedDepartments.map(d => `<option value="${d._id}" ${c.department && c.department._id === d._id ? 'selected' : ''}>${d.name}</option>`).join('');

    // Populate Staff Select
    const staffSelect = document.getElementById('modalStaffSelect');
    staffSelect.innerHTML = '<option value="">-- Select Staff Member --</option>' + 
      cachedStaff.map(s => `<option value="${s._id}" ${c.assignedTo && c.assignedTo._id === s._id ? 'selected' : ''}>${s.name} (${s.department ? s.department.name : 'General Staff'})</option>`).join('');

    // Set Status & Priority
    document.getElementById('modalStatusSelect').value = c.status || 'Verified';
    document.getElementById('modalPrioritySelect').value = c.priority || 'Medium';
    document.getElementById('modalAdminRemarks').value = '';

    bsModal.show();

  } catch (err) {
    alert('Error fetching complaint details: ' + err.message);
  }
}

function initAdminModalForm() {
  const form = document.getElementById('adminManageForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentAdminComplaintId) return;

    const alertBox = document.getElementById('adminModalAlert');
    const submitBtn = document.getElementById('btnSaveAdminManage');

    const status = document.getElementById('modalStatusSelect').value;
    const departmentId = document.getElementById('modalDepartmentSelect').value;
    const assignedToStaffId = document.getElementById('modalStaffSelect').value;
    const priority = document.getElementById('modalPrioritySelect').value;
    const remarks = document.getElementById('modalAdminRemarks').value;

    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

      await API.request(`/complaints/${currentAdminComplaintId}/verify-assign`, {
        method: 'PUT',
        body: JSON.stringify({
          status,
          departmentId,
          assignedToStaffId,
          priority,
          remarks
        })
      });

      showAlert(alertBox, 'Complaint updated and assigned successfully!', 'success');

      setTimeout(() => {
        const modalEl = document.getElementById('adminManageModal');
        const bsModal = bootstrap.Modal.getInstance(modalEl);
        if (bsModal) bsModal.hide();
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Save Changes';
        loadAdminComplaints();
      }, 800);

    } catch (err) {
      showAlert(alertBox, err.message || 'Failed to update complaint', 'danger');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Save Changes';
    }
  });
}
