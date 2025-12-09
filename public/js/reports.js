// public/js/reports.js
// Client-side JavaScript for Reports - KOEN'S FEATURES
// This handles AJAX submissions and dynamic updates for reports

// XSS Protection - Sanitize user input on client side
function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

// Show error message
function showError(elementId, message) {
    const errorDiv = document.getElementById(elementId);
    if (errorDiv) {
        errorDiv.textContent = sanitizeHTML(message);
        errorDiv.style.display = 'block';
    }
}

// Hide error message
function hideError(elementId) {
    const errorDiv = document.getElementById(elementId);
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

// Show success message
function showSuccess(elementId, message) {
    const successDiv = document.getElementById(elementId);
    if (successDiv) {
        successDiv.textContent = sanitizeHTML(message);
        successDiv.style.display = 'block';
    }
}

// Hide success message
function hideSuccess(elementId) {
    const successDiv = document.getElementById(elementId);
    if (successDiv) {
        successDiv.style.display = 'none';
    }
}

// Initialize report form handlers when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create report form handler
    const reportForm = document.getElementById('reportForm');
    
    if (reportForm) {
        reportForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError('reportError');

            const formData = {
                neighborhood: document.getElementById('neighborhood').value.trim(),
                borough: document.getElementById('borough').value,
                description: document.getElementById('description').value.trim(),
                reportType: document.getElementById('reportType').value,
                severity: document.getElementById('severity').value
            };

            // Client-side validation
            if (!formData.neighborhood || formData.neighborhood.length < 2) {
                showError('reportError', 'Neighborhood must be at least 2 characters');
                return;
            }

            if (!formData.borough) {
                showError('reportError', 'Please select a borough');
                return;
            }

            if (!formData.reportType) {
                showError('reportError', 'Please select a report type');
                return;
            }

            if (!formData.severity) {
                showError('reportError', 'Please select a severity level');
                return;
            }

            if (formData.description.length < 10) {
                showError('reportError', 'Description must be at least 10 characters');
                return;
            }

            try {
                const response = await fetch('/reports/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (data.success) {
                    alert('Report submitted successfully!');
                    window.location.href = '/reports/my';
                } else {
                    showError('reportError', data.error || 'Failed to submit report');
                }
            } catch (error) {
                showError('reportError', 'An error occurred while submitting the report');
            }
        });
    }
});

// Update report status (called from view.handlebars)
async function updateReportStatus(reportId) {
    const newStatus = document.getElementById('newStatus').value;
    const errorDiv = document.getElementById('statusError');
    const successDiv = document.getElementById('statusSuccess');
    
    hideError('statusError');
    hideSuccess('statusSuccess');

    try {
        const response = await fetch(`/reports/${reportId}/status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        const data = await response.json();

        if (data.success) {
            // Update the status display
            const statusSpan = document.getElementById('reportStatus');
            statusSpan.textContent = newStatus;
            
            // Update status badge color
            statusSpan.className = 'score ';
            if (newStatus === 'Resolved') {
                statusSpan.className += 'safe';
            } else if (newStatus === 'Reviewed') {
                statusSpan.className += 'moderate';
            } else {
                statusSpan.className += 'high-risk';
            }
            
            // Show success message
            showSuccess('statusSuccess', 'Status updated successfully!');
        } else {
            showError('statusError', data.error || 'Failed to update status');
        }
    } catch (error) {
        showError('statusError', 'An error occurred while updating the status');
    }
}

// Make function available globally for inline onclick handlers
window.updateReportStatus = updateReportStatus;