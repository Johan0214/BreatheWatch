document.addEventListener('DOMContentLoaded', () => {
    const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]|;:'",.<>/?\\~`]).{8,}$/;
    const PASSWORD_MESSAGE = 'Password must be at least 8 characters long and contain: one lowercase letter, one uppercase letter, one number, and one special character.';

    const displayError = (id, message) => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = message;
            el.style.display = message ? 'block' : 'none';
        }
    };

    const validateString = (str, name) => {
        if (!str || str.trim().length === 0) return `${name} is required`;
        return null;
    };

    const validateLoginForm = () => {
        let valid = true;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        displayError('username-error', null);
        displayError('password-error', null);

        let uErr = validateString(username, 'Username');
        if (uErr) { displayError('username-error', uErr); valid = false; }

        let pErr = validateString(password, 'Password');
        if (pErr) { displayError('password-error', pErr); valid = false; }
        else if (!STRONG_PASSWORD_REGEX.test(password)) { displayError('password-error', PASSWORD_MESSAGE); valid = false; }

        return valid;
    };

    const validateSignupForm = () => {
        let valid = true;
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        displayError('firstName-error', null);
        displayError('lastName-error', null);
        displayError('username-error', null);
        displayError('password-error', null);
        displayError('confirmPassword-error', null);

        if (validateString(firstName, 'First Name')) { displayError('firstName-error', 'First Name is required'); valid = false; }
        if (validateString(lastName, 'Last Name')) { displayError('lastName-error', 'Last Name is required'); valid = false; }
        if (validateString(username, 'Username')) { displayError('username-error', 'Username is required'); valid = false; }
        if (!STRONG_PASSWORD_REGEX.test(password)) { displayError('password-error', PASSWORD_MESSAGE); valid = false; }
        if (password !== confirmPassword) { displayError('confirmPassword-error', 'Passwords do not match'); valid = false; }

        return valid;
    };

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', e => { if (!validateLoginForm()) e.preventDefault(); });
    }

    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', e => { if (!validateSignupForm()) e.preventDefault(); });
    }

    //Profile dropdown test
    const boroughSelect = document.getElementById('borough');
    const neighborhoodSelect = document.getElementById('neighborhood');

    if (boroughSelect && neighborhoodSelect) {
        boroughSelect.addEventListener('change', async function() {
            const selectedBorough = this.value;
            
            // Clear current list
            neighborhoodSelect.innerHTML = '<option value="">Loading...</option>';
            
            if (!selectedBorough) {
                neighborhoodSelect.innerHTML = '<option value="">Select your neighborhood</option>';
                return;
            }

            try {
                const response = await fetch(`/api/neighborhoods?borough=${selectedBorough}`);
                const neighborhoods = await response.json();

                neighborhoodSelect.innerHTML = '<option value="">Select your neighborhood</option>';
                
                neighborhoods.forEach(n => {
                    const option = document.createElement('option');
                    option.value = n;
                    option.textContent = n;
                    neighborhoodSelect.appendChild(option);
                });
            } catch (e) {
                console.error("Error fetching neighborhoods:", e);
                neighborhoodSelect.innerHTML = '<option value="">Error loading list</option>';
            }
        });
    }
});
