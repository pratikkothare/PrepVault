// Main JavaScript file for University Papers Portal

// Global variables
let currentUser = null;
let currentPaper = null;
let searchTimeout = null;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupGlobalEventListeners();
    loadUserSession();
});

// Initialize application
function initializeApp() {
    // Add loading states
    addLoadingStates();
    
    // Initialize tooltips
    initializeTooltips();
    
    // Initialize modals
    initializeModals();
    
    // Setup theme
    initializeTheme();
    
    // Setup accessibility
    setupAccessibility();
}

// Setup global event listeners
function setupGlobalEventListeners() {
    // Search functionality
    setupSearchListeners();
    
    // Filter functionality
    setupFilterListeners();
    
    // Modal events
    setupModalListeners();
    
    // Rating system
    setupRatingSystem();
    
    // Comment system
    setupCommentSystem();
    
    // File upload
    setupFileUpload();
    
    // Keyboard shortcuts
    setupKeyboardShortcuts();
}

// Load user session
function loadUserSession() {
    // This would typically fetch user data from the server
    // For now, we'll use session storage or check if user is logged in
    const userElement = document.querySelector('[data-user-id]');
    if (userElement) {
        currentUser = {
            id: userElement.dataset.userId,
            username: userElement.dataset.username,
            role: userElement.dataset.role
        };
    }
}

// Search functionality
function setupSearchListeners() {
    const searchInputs = document.querySelectorAll('[data-search]');
    
    searchInputs.forEach(input => {
        input.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performSearch(this.value, this.dataset.search);
            }, 300);
        });
        
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch(this.value, this.dataset.search);
            }
        });
    });
}

// Perform search
function performSearch(query, type = 'papers') {
    if (!query.trim()) {
        return;
    }
    
    showLoadingState('search-results');
    
    const params = new URLSearchParams({
        search: query,
        type: type
    });
    
    fetch(`/api/search?${params.toString()}`)
        .then(response => response.json())
        .then(data => {
            displaySearchResults(data, type);
        })
        .catch(error => {
            console.error('Search error:', error);
            showErrorMessage('Search failed. Please try again.');
        })
        .finally(() => {
            hideLoadingState('search-results');
        });
}

// Display search results
function displaySearchResults(results, type) {
    const container = document.getElementById('search-results') || document.getElementById('papersContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (results.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <i class="fas fa-search fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">No results found</h5>
                <p class="text-muted">Try different keywords or adjust your filters</p>
            </div>
        `;
        return;
    }
    
    results.forEach(item => {
        if (type === 'papers') {
            const paperCard = createPaperCard(item);
            container.appendChild(paperCard);
        }
    });
    
    // Update results count
    updateResultsCount(results.length);
}

// Filter functionality
function setupFilterListeners() {
    const filterElements = document.querySelectorAll('[data-filter]');
    
    filterElements.forEach(element => {
        element.addEventListener('change', function() {
            applyFilters();
        });
    });
    
    // Clear filters button
    const clearFiltersBtn = document.getElementById('clearFilters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearAllFilters);
    }
}

// Apply filters
function applyFilters() {
    const filters = {};
    const filterElements = document.querySelectorAll('[data-filter]');
    
    filterElements.forEach(element => {
        if (element.value) {
            filters[element.dataset.filter] = element.value;
        }
    });
    
    const searchQuery = document.getElementById('searchInput')?.value || '';
    if (searchQuery) {
        filters.search = searchQuery;
    }
    
    loadPapersWithFilters(filters);
}

// Load papers with filters
function loadPapersWithFilters(filters) {
    showLoadingState('papers-container');
    
    const params = new URLSearchParams(filters);
    
    fetch(`/api/papers?${params.toString()}`)
        .then(response => response.json())
        .then(papers => {
            displayPapers(papers);
            updateResultsCount(papers.length);
        })
        .catch(error => {
            console.error('Filter error:', error);
            showErrorMessage('Failed to load papers. Please try again.');
        })
        .finally(() => {
            hideLoadingState('papers-container');
        });
}

// Clear all filters
function clearAllFilters() {
    const filterElements = document.querySelectorAll('[data-filter]');
    filterElements.forEach(element => {
        element.value = '';
    });
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    applyFilters();
}

// Create paper card
function createPaperCard(paper) {
    const col = document.createElement('div');
    col.className = 'col-md-4 col-lg-3 mb-4';
    
    const avgRating = paper.avg_rating || 0;
    const stars = generateStarRating(avgRating);
    
    col.innerHTML = `
        <div class="card h-100 paper-card" data-paper-id="${paper.id}">
            <div class="card-body">
                <h6 class="card-title text-truncate-2" title="${escapeHtml(paper.title)}">
                    ${escapeHtml(paper.title)}
                </h6>
                <p class="card-text small text-muted mb-2">
                    <i class="fas fa-building me-1"></i>${escapeHtml(paper.department)}<br>
                    <i class="fas fa-calendar me-1"></i>Semester ${paper.semester}<br>
                    <i class="fas fa-book me-1"></i>${escapeHtml(paper.subject)}<br>
                    <i class="fas fa-clock me-1"></i>${paper.year}
                </p>
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="badge bg-primary">${escapeHtml(paper.exam_type)}</span>
                    <small class="text-muted">${paper.pages} pages</small>
                </div>
                <div class="d-flex justify-content-between align-items-center">
                    <div class="rating">
                        <span class="stars">${stars}</span>
                        <small class="text-muted">(${paper.rating_count || 0})</small>
                    </div>
                    <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary" onclick="viewPaper(${paper.id})" title="View Paper">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="downloadPaper(${paper.id})" title="Download">
                            <i class="fas fa-download"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return col;
}

// Generate star rating HTML
function generateStarRating(rating, interactive = false) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
            stars += interactive ? 
                `<i class="fas fa-star rating-star" data-rating="${i}"></i>` :
                '<i class="fas fa-star text-warning"></i>';
        } else if (i === fullStars + 1 && hasHalfStar) {
            stars += interactive ?
                `<i class="fas fa-star-half-alt rating-star" data-rating="${i}"></i>` :
                '<i class="fas fa-star-half-alt text-warning"></i>';
        } else {
            stars += interactive ?
                `<i class="far fa-star rating-star" data-rating="${i}"></i>` :
                '<i class="far fa-star text-muted"></i>';
        }
    }
    
    return stars;
}

// Modal functionality
function setupModalListeners() {
    // Paper detail modal
    const paperModal = document.getElementById('paperModal');
    if (paperModal) {
        paperModal.addEventListener('show.bs.modal', function(event) {
            const paperId = event.relatedTarget?.dataset.paperId;
            if (paperId) {
                loadPaperDetails(paperId);
            }
        });
        
        paperModal.addEventListener('hidden.bs.modal', function() {
            // Clear modal content
            currentPaper = null;
        });
    }
}

// Load paper details
function loadPaperDetails(paperId) {
    showLoadingState('paper-modal-content');
    
    fetch(`/api/papers/${paperId}`)
        .then(response => response.json())
        .then(paper => {
            currentPaper = paper;
            displayPaperDetails(paper);
            loadPaperComments(paperId);
            loadUserRating(paperId);
        })
        .catch(error => {
            console.error('Error loading paper details:', error);
            showErrorMessage('Failed to load paper details.');
        })
        .finally(() => {
            hideLoadingState('paper-modal-content');
        });
}

// Display paper details
function displayPaperDetails(paper) {
    // Debug logging
    console.log('Paper details:', paper);
    console.log('File path:', paper.file_path);
    
    // Update modal title
    document.getElementById('paperModalTitle').textContent = paper.title;
    
    // Load PDF
    const pdfFrame = document.getElementById('pdfFrame');
    if (pdfFrame) {
        const pdfUrl = `/uploads/${paper.file_path}`;
        console.log('PDF URL:', pdfUrl);
        pdfFrame.src = pdfUrl;
    }
    
    // Display paper info
    const paperInfo = document.getElementById('paperInfo');
    if (paperInfo) {
        paperInfo.innerHTML = `
            <p><strong>Department:</strong> ${escapeHtml(paper.department)}</p>
            <p><strong>Semester:</strong> ${paper.semester}</p>
            <p><strong>Subject:</strong> ${escapeHtml(paper.subject)}</p>
            <p><strong>Year:</strong> ${paper.year}</p>
            <p><strong>Exam Type:</strong> ${escapeHtml(paper.exam_type)}</p>
            <p><strong>Pages:</strong> ${paper.pages}</p>
            <p><strong>File Size:</strong> ${formatFileSize(paper.file_size)}</p>
            <p><strong>Uploaded by:</strong> ${escapeHtml(paper.uploader_name)}</p>
            <p><strong>Upload Date:</strong> ${formatDate(paper.upload_date)}</p>
            ${paper.description ? `<p><strong>Description:</strong> ${escapeHtml(paper.description)}</p>` : ''}
            <div class="mt-3">
                <div class="d-flex align-items-center mb-2">
                    <span class="me-2">Rating:</span>
                    ${generateStarRating(paper.avg_rating || 0)}
                    <span class="ms-2 text-muted">(${paper.rating_count || 0} ratings)</span>
                </div>
            </div>
        `;
    }
}

// Rating system
function setupRatingSystem() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('rating-star')) {
            const rating = parseInt(e.target.dataset.rating);
            submitRating(currentPaper?.id, rating);
        }
    });
    
    // Hover effects for rating stars
    document.addEventListener('mouseover', function(e) {
        if (e.target.classList.contains('rating-star')) {
            highlightStars(e.target.dataset.rating);
        }
    });
    
    document.addEventListener('mouseout', function(e) {
        if (e.target.classList.contains('rating-star')) {
            resetStarHighlight();
        }
    });
}

// Highlight stars on hover
function highlightStars(rating) {
    const stars = document.querySelectorAll('.rating-star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('text-warning');
            star.classList.remove('text-muted');
        } else {
            star.classList.add('text-muted');
            star.classList.remove('text-warning');
        }
    });
}

// Reset star highlight
function resetStarHighlight() {
    // Reset to current user rating or default state
    loadUserRating(currentPaper?.id);
}

// Submit rating
function submitRating(paperId, rating) {
    if (!paperId || !currentUser) {
        showErrorMessage('Please log in to rate papers.');
        return;
    }
    
    fetch('/api/rate-paper', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            paper_id: paperId,
            rating: rating
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showSuccessMessage('Rating submitted successfully!');
            updatePaperRating(paperId, data.new_average, data.rating_count);
        } else {
            showErrorMessage(data.message || 'Failed to submit rating.');
        }
    })
    .catch(error => {
        console.error('Rating error:', error);
        showErrorMessage('Failed to submit rating.');
    });
}

// Load user rating
function loadUserRating(paperId) {
    if (!paperId || !currentUser) return;
    
    fetch(`/api/user-rating/${paperId}`)
        .then(response => response.json())
        .then(data => {
            if (data.rating) {
                displayUserRating(data.rating);
            }
        })
        .catch(error => {
            console.error('Error loading user rating:', error);
        });
}

// Display user rating
function displayUserRating(rating) {
    const stars = document.querySelectorAll('.rating-star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('text-warning', 'active');
            star.classList.remove('text-muted');
        } else {
            star.classList.add('text-muted');
            star.classList.remove('text-warning', 'active');
        }
    });
}

// Comment system
function setupCommentSystem() {
    const submitCommentBtn = document.getElementById('submitComment');
    if (submitCommentBtn) {
        submitCommentBtn.addEventListener('click', function() {
            const commentText = document.getElementById('commentText')?.value;
            if (commentText && currentPaper) {
                submitComment(currentPaper.id, commentText);
            }
        });
    }
    
    // Enter key to submit comment
    const commentTextarea = document.getElementById('commentText');
    if (commentTextarea) {
        commentTextarea.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                const commentText = this.value;
                if (commentText && currentPaper) {
                    submitComment(currentPaper.id, commentText);
                }
            }
        });
    }
}

// Submit comment
function submitComment(paperId, comment) {
    if (!currentUser) {
        showErrorMessage('Please log in to comment.');
        return;
    }
    
    fetch('/api/add-comment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            paper_id: paperId,
            comment: comment
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            document.getElementById('commentText').value = '';
            loadPaperComments(paperId);
            showSuccessMessage('Comment added successfully!');
        } else {
            showErrorMessage(data.message || 'Failed to add comment.');
        }
    })
    .catch(error => {
        console.error('Comment error:', error);
        showErrorMessage('Failed to add comment.');
    });
}

// Load paper comments
function loadPaperComments(paperId) {
    fetch(`/api/comments/${paperId}`)
        .then(response => response.json())
        .then(comments => {
            displayComments(comments);
        })
        .catch(error => {
            console.error('Error loading comments:', error);
        });
}

// Display comments
function displayComments(comments) {
    const commentsList = document.getElementById('commentsList');
    if (!commentsList) return;
    
    if (comments.length === 0) {
        commentsList.innerHTML = '<p class="text-muted">No comments yet. Be the first to comment!</p>';
        return;
    }
    
    commentsList.innerHTML = comments.map(comment => `
        <div class="comment-item">
            <div class="d-flex justify-content-between align-items-start">
                <div class="comment-author">${escapeHtml(comment.username)}</div>
                <div class="comment-date">${formatDate(comment.created_at)}</div>
            </div>
            <div class="comment-text">${escapeHtml(comment.comment)}</div>
        </div>
    `).join('');
}

// File upload functionality
function setupFileUpload() {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    
    fileInputs.forEach(input => {
        input.addEventListener('change', function(e) {
            handleFileSelection(e.target.files[0], e.target);
        });
    });
}

// Handle file selection
function handleFileSelection(file, input) {
    if (!file) return;
    
    // Validate file type
    if (file.type !== 'application/pdf') {
        showErrorMessage('Please select a PDF file only.');
        input.value = '';
        return;
    }
    
    // Validate file size (16MB)
    if (file.size > 16 * 1024 * 1024) {
        showErrorMessage('File size must be less than 16MB.');
        input.value = '';
        return;
    }
    
    // Show file info
    displayFileInfo(file, input);
}

// Display file info
function displayFileInfo(file, input) {
    const fileInfo = input.parentElement.querySelector('.file-info');
    if (fileInfo) {
        fileInfo.innerHTML = `
            <div class="d-flex align-items-center p-2">
                <i class="fas fa-file-pdf fa-2x text-danger me-3"></i>
                <div class="flex-grow-1">
                    <h6 class="mb-1">${escapeHtml(file.name)}</h6>
                    <small class="text-muted">${formatFileSize(file.size)}</small>
                </div>
            </div>
        `;
        fileInfo.style.display = 'block';
    }
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.focus();
            }
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            const openModal = document.querySelector('.modal.show');
            if (openModal) {
                const modal = bootstrap.Modal.getInstance(openModal);
                if (modal) {
                    modal.hide();
                }
            }
        }
    });
}

// Utility functions
function showLoadingState(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;
    }
}

function hideLoadingState(elementId) {
    // This would be handled by the specific display functions
}

function showSuccessMessage(message) {
    showToast(message, 'success');
}

function showErrorMessage(message) {
    showToast(message, 'error');
}

function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'primary'} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${escapeHtml(message)}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    // Add to toast container
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    toastContainer.appendChild(toast);
    
    // Show toast
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remove toast element after it's hidden
    toast.addEventListener('hidden.bs.toast', function() {
        toast.remove();
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function updateResultsCount(count) {
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
        resultsCount.textContent = `${count} paper${count !== 1 ? 's' : ''} found`;
    }
}

function initializeTooltips() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

function initializeModals() {
    // Initialize any modals that need special handling
}

function initializeTheme() {
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function setupAccessibility() {
    // Add ARIA labels and improve accessibility
    const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
    buttons.forEach(button => {
        if (button.querySelector('i.fas, i.far')) {
            const icon = button.querySelector('i');
            const iconClass = Array.from(icon.classList).find(cls => cls.startsWith('fa-'));
            if (iconClass) {
                const action = iconClass.replace('fa-', '').replace('-', ' ');
                button.setAttribute('aria-label', action);
            }
        }
    });
}

function addLoadingStates() {
    // Add loading states to elements that will load content dynamically
    const loadingElements = document.querySelectorAll('[data-loading]');
    loadingElements.forEach(element => {
        element.innerHTML = `
            <div class="text-center py-3">
                <div class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;
    });
}

// Global functions that can be called from HTML
window.viewPaper = function(paperId) {
    // Find paper in current papers array or fetch it
    const paper = window.allPapers?.find(p => p.id === paperId);
    if (paper) {
        currentPaper = paper;
        const modal = new bootstrap.Modal(document.getElementById('paperModal'));
        modal.show();
        loadPaperDetails(paperId);
    } else {
        // Redirect to paper view page
        window.location.href = `/?paper=${paperId}`;
    }
};

window.downloadPaper = function(paperId) {
    window.open(`/api/download/${paperId}`, '_blank');
};

window.editPaper = function(paperId) {
    window.location.href = `/admin/edit-paper/${paperId}`;
};

window.deletePaper = function(paperId) {
    if (confirm('Are you sure you want to delete this paper?')) {
        fetch(`/api/papers/${paperId}`, {
            method: 'DELETE'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showSuccessMessage('Paper deleted successfully!');
                // Reload the page or remove the paper from the list
                location.reload();
            } else {
                showErrorMessage(data.message || 'Failed to delete paper.');
            }
        })
        .catch(error => {
            console.error('Delete error:', error);
            showErrorMessage('Failed to delete paper.');
        });
    }
};